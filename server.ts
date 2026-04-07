import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CENTRAL_WALLET = process.env.CENTRAL_WALLET || 'efcdc45a4040ac7f4d35b0e8d4df3cde';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // ─── API Key middleware ────────────────────────────────────────────────────
  const checkApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'غير مصرح: مفتاح API مفقود أو غير صحيح' });
    }

    const apiKey = authHeader.split(' ')[1];
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error || !profile) {
      return res.status(401).json({ success: false, error: 'غير مصرح: مفتاح API غير صالح' });
    }

    // Reset daily count if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_reset !== today) {
      await supabase
        .from('profiles')
        .update({ daily_count: 0, last_reset: today })
        .eq('id', profile.id);
      profile.daily_count = 0;
      profile.last_reset = today;
    }

    // Check daily limit
    const limit = profile.plan === 'pro' ? 10000 : profile.plan === 'custom' ? Infinity : 100;
    if (profile.daily_count >= limit) {
      return res.status(429).json({ success: false, error: 'تم تجاوز الحد اليومي للمعاملات' });
    }

    (req as any).user = profile;
    next();
  };

  // ─── POST /api/v1/invoice/create ──────────────────────────────────────────
  app.post('/api/v1/invoice/create', checkApiKey, async (req, res) => {
    try {
      const { amount, currency, webhook_url } = req.body;
      const user = (req as any).user;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, error: 'المبلغ يجب أن يكون رقماً موجباً' });
      }
      if (currency !== 'دولار' && currency !== 'ليرة سورية') {
        return res.status(400).json({ success: false, error: 'العملة يجب أن تكون: دولار أو ليرة سورية' });
      }

      // Generate unique amount
      let uniqueAmount = amount;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 100) {
        const randomCents = Math.floor(Math.random() * 99) + 1;
        uniqueAmount = Math.round((amount + randomCents / 100) * 100) / 100;

        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('unique_amount', uniqueAmount)
          .eq('currency', currency)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (!existing) isUnique = true;
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ success: false, error: 'تعذّر توليد مبلغ فريد، يرجى المحاولة لاحقاً' });
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          original_amount: amount,
          unique_amount: uniqueAmount,
          currency,
          webhook_url: webhook_url || null,
          expires_at: expiresAt,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Increment daily count
      await supabase
        .from('profiles')
        .update({ daily_count: user.daily_count + 1 })
        .eq('id', user.id);

      return res.json({
        success: true,
        invoice_id: invoice.id,
        pay_amount: uniqueAmount,
        currency,
        wallet_address: CENTRAL_WALLET,
        expires_at: expiresAt,
        expires_in_seconds: 600,
      });

    } catch (err: any) {
      console.error('invoice/create error:', err);
      return res.status(500).json({ success: false, error: err.message || 'خطأ داخلي في السيرفر' });
    }
  });

  // ─── GET /api/v1/invoice/:id ───────────────────────────────────────────────
  app.get('/api/v1/invoice/:id', checkApiKey, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !invoice) {
        return res.status(404).json({ success: false, error: 'الفاتورة غير موجودة' });
      }

      // Auto-expire
      if (invoice.status === 'pending' && new Date(invoice.expires_at) < new Date()) {
        await supabase.from('invoices').update({ status: 'expired' }).eq('id', invoice.id);
        invoice.status = 'expired';
      }

      return res.json({
        success: true,
        invoice_id: invoice.id,
        original_amount: invoice.original_amount,
        pay_amount: invoice.unique_amount,
        currency: invoice.currency,
        status: invoice.status,
        paid_at: invoice.paid_at || null,
      });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── GET /api/v1/balance ──────────────────────────────────────────────────
  app.get('/api/v1/balance', checkApiKey, async (req, res) => {
    const user = (req as any).user;
    return res.json({
      success: true,
      balance: { usd: Number(user.balance_usd || 0), syp: Number(user.balance_syp || 0) },
    });
  });

  // ─── GET /api/v1/transactions ─────────────────────────────────────────────
  app.get('/api/v1/transactions', checkApiKey, async (req, res) => {
    try {
      const user = (req as any).user;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;
      const currency = req.query.currency as string | undefined;

      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status) query = query.eq('status', status);
      if (currency) query = query.eq('currency', currency);

      const { data: transactions, count, error } = await query;
      if (error) throw error;

      return res.json({
        success: true,
        transactions: transactions || [],
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      });

    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── POST /api/webhook/incoming ───────────────────────────────────────────
  app.post('/api/webhook/incoming', async (req, res) => {
    try {
      const secret = req.headers['x-webhook-secret'];
      if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
        return res.status(403).json({ success: false, error: 'ممنوع: secret غير صحيح' });
      }

      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: 'نص الإشعار مفقود' });
      }

      // Save raw incoming payment
      const { data: incomingPayment, error: insertError } = await supabase
        .from('incoming_payments')
        .insert({ raw_text: text, status: 'unmatched' })
        .select()
        .single();

      if (insertError) throw insertError;

      // Parse: "لقد وصلتك حوالة بقيمة 50.03 دولار"
      const match = text.match(/لقد وصلتك حوالة بقيمة ([\d.]+) (دولار|ليرة سورية)/);
      if (!match) {
        console.log('Webhook: regex failed for text:', text);
        return res.json({ success: true, message: 'تم الحفظ كغير متطابق (regex فشل)' });
      }

      const amount = parseFloat(match[1]);
      const currency = match[2];

      // Update with parsed data
      await supabase
        .from('incoming_payments')
        .update({ amount, currency })
        .eq('id', incomingPayment.id);

      // Find matching invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('unique_amount', amount)
        .eq('currency', currency)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!invoice) {
        console.log('Webhook: no matching invoice for amount', amount, currency);
        return res.json({ success: true, message: 'تم الحفظ كغير متطابق (لا توجد فاتورة معلقة)' });
      }

      const paidAt = new Date().toISOString();

      // Update invoice to paid
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: paidAt })
        .eq('id', invoice.id);

      // Get user and update balance
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invoice.user_id)
        .single();

      if (userProfile) {
        const balanceField = currency === 'دولار' ? 'balance_usd' : 'balance_syp';
        const newBalance = Number(userProfile[balanceField] || 0) + Number(invoice.original_amount);

        await supabase
          .from('profiles')
          .update({ [balanceField]: newBalance })
          .eq('id', userProfile.id);

        await supabase
          .from('incoming_payments')
          .update({
            status: 'matched',
            matched_invoice_id: invoice.id,
            matched_user_id: userProfile.id,
          })
          .eq('id', incomingPayment.id);

        // Fire webhook to client if configured
        if (invoice.webhook_url) {
          try {
            await fetch(invoice.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'payment.confirmed',
                invoice_id: invoice.id,
                amount: invoice.original_amount,
                currency: invoice.currency,
                paid_at: paidAt,
              }),
            });
          } catch (webhookErr) {
            console.error('Failed to deliver client webhook:', webhookErr);
          }
        }
      }

      console.log(`✅ Payment matched: invoice ${invoice.id}, amount ${amount} ${currency}`);
      return res.json({ success: true, message: 'تم مطابقة الدفعة وتحديث الرصيد بنجاح' });

    } catch (err: any) {
      console.error('webhook/incoming error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── Static / Vite ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SybAPI server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
