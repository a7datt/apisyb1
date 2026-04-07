import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Eye, EyeOff, Copy, RefreshCw, X, Loader2, Check, Terminal, Shield } from 'lucide-react';

const CodeBlock = ({ method, color, url, children }: any) => (
  <div style={{ backgroundColor: '#0a0a14', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0d0d1a' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: color, fontFamily: 'monospace', backgroundColor: `${color}18`, padding: '2px 8px', borderRadius: '6px' }}>{method}</span>
      <span style={{ fontSize: '12px', color: '#818cf8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
    </div>
    <pre style={{ margin: 0, padding: '16px', fontSize: '12px', color: '#8888aa', fontFamily: 'monospace', lineHeight: '1.7', overflowX: 'auto' }} dir="ltr">
      {children}
    </pre>
  </div>
);

export default function ApiKey() {
  const { profile, refreshProfile } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.api_key || '');
    setCopied(true);
    toast.success('تم نسخ المفتاح!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const newKey = `sk_live_${uuidv4().replace(/-/g, '')}`;
    const { error } = await supabase.from('profiles').update({ api_key: newKey }).eq('id', profile.id);
    if (error) {
      toast.error('حدث خطأ أثناء إعادة توليد المفتاح');
    } else {
      toast.success('تم إعادة توليد المفتاح بنجاح');
      await refreshProfile();
      setShowModal(false);
      setShowKey(true);
    }
    setRegenerating(false);
  };

  const maskedKey = 'sk_live_' + '•'.repeat(32);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in-up">
      <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cairo' }}>مفتاح الـ API</h1>

      {/* API Key Card */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>مفتاح الربط (API Key)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>استخدمه في Authorization header</div>
          </div>
        </div>

        {/* Key display */}
        <div style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: showKey ? '#818cf8' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="ltr">
            {showKey ? (profile.api_key || '—') : maskedKey}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setShowKey(!showKey)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
        </div>

        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', color: '#ef4444', fontSize: '13px', fontWeight: '600', fontFamily: 'Cairo', cursor: 'pointer',
        }}>
          <RefreshCw size={15} /> إعادة توليد المفتاح
        </button>
      </div>

      {/* Documentation */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>توثيق الاستخدام</div>
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', fontFamily: 'Cairo', marginBottom: '12px', marginTop: 0 }}>1. إنشاء فاتورة دفع</h3>
        <CodeBlock method="POST" color="#22c55e" url="https://sybapi.com/api/v1/invoice/create">
{`Headers:
  Authorization: Bearer sk_live_xxxxxxxxxx
  Content-Type: application/json

Body:
{
  "amount": 50,
  "currency": "دولار",
  "webhook_url": "https://your-site.com/confirm"
}

Response:
{
  "success": true,
  "invoice_id": "uuid-here",
  "pay_amount": 50.03,
  "currency": "دولار",
  "wallet_address": "efcdc45a...",
  "expires_at": "2024-01-01T10:10:00Z",
  "expires_in_seconds": 600
}`}
        </CodeBlock>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', fontFamily: 'Cairo', marginBottom: '12px', marginTop: '8px' }}>2. التحقق من حالة فاتورة</h3>
        <CodeBlock method="GET" color="#3b82f6" url="https://sybapi.com/api/v1/invoice/:id">
{`Headers:
  Authorization: Bearer sk_live_xxxxxxxxxx

Response:
{
  "success": true,
  "invoice_id": "uuid-here",
  "original_amount": 50,
  "pay_amount": 50.03,
  "currency": "دولار",
  "status": "paid",
  "paid_at": "2024-01-01T10:05:00Z"
}`}
        </CodeBlock>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', fontFamily: 'Cairo', marginBottom: '12px', marginTop: '8px' }}>3. جلب الرصيد</h3>
        <CodeBlock method="GET" color="#818cf8" url="https://sybapi.com/api/v1/balance">
{`Headers:
  Authorization: Bearer sk_live_xxxxxxxxxx

Response:
{
  "success": true,
  "balance": {
    "usd": 150.09,
    "syp": 50000
  }
}`}
        </CodeBlock>
      </div>

      {/* Regenerate Modal */}
      {showModal && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '24px' }}>
          <div className="animate-fade-in-up" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '28px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ef4444', margin: 0, fontFamily: 'Cairo' }}>تحذير هام</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', fontFamily: 'Cairo', marginBottom: '24px' }}>
              سيتم إلغاء مفتاحك الحالي <strong style={{ color: 'var(--text-primary)' }}>فوراً</strong> وأي تطبيق يستخدمه سيتوقف عن العمل. هل أنت متأكد من إعادة التوليد؟
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleRegenerate} disabled={regenerating} style={{
                flex: 1, height: '44px', backgroundColor: '#ef4444', border: 'none',
                borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', fontFamily: 'Cairo',
                cursor: regenerating ? 'not-allowed' : 'pointer', opacity: regenerating ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {regenerating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                نعم، أعد التوليد
              </button>
              <button onClick={() => setShowModal(false)} disabled={regenerating} style={{
                flex: 1, height: '44px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', fontFamily: 'Cairo', cursor: 'pointer',
              }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
