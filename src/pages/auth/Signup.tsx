import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, Wallet, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shamcashAddress, setShamcashAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputStyle = {
    width: '100%',
    height: '44px',
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '0 40px 0 16px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontFamily: 'Cairo',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    fontFamily: 'Cairo',
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('كلمات المرور غير متطابقة');
    if (password.length < 6) return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(error.message === 'User already registered' ? 'البريد الإلكتروني مسجل مسبقاً' : error.message);
    } else if (data.user) {
      toast.success('تم إنشاء الحساب بنجاح');
      setStep(2);
    }
    setLoading(false);
  };

  const handleConfirmAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shamcashAddress.trim()) return toast.error('يرجى إدخال عنوان المحفظة');
    if (shamcashAddress.trim().length < 20) return toast.error('عنوان المحفظة غير صحيح');

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const apiKey = `sk_live_${uuidv4().replace(/-/g, '')}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          shamcash_address: shamcashAddress.trim(),
          address_confirmed: true,
          api_key: apiKey,
          email: user.email,
        })
        .eq('id', user.id);

      if (error) {
        // Try insert if update fails (profile might not exist yet)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            shamcash_address: shamcashAddress.trim(),
            address_confirmed: true,
            api_key: apiKey,
            plan: 'basic',
            balance_usd: 0,
            balance_syp: 0,
            daily_count: 0,
          });
        
        if (insertError) {
          toast.error('حدث خطأ أثناء حفظ البيانات');
          setLoading(false);
          return;
        }
      }
      
      toast.success('تم إعداد حسابك بنجاح!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in-up">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
          }}>
            <Zap size={26} color="white" fill="white" />
          </div>

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  backgroundColor: step >= s ? '#6366f1' : 'var(--bg-card)',
                  border: `2px solid ${step >= s ? '#6366f1' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700', color: step >= s ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.3s'
                }}>
                  {step > s ? <CheckCircle2 size={14} /> : s}
                </div>
                {s < 2 && <div style={{ width: '40px', height: '2px', backgroundColor: step > s ? '#6366f1' : 'var(--border)', transition: 'all 0.3s' }} />}
              </div>
            ))}
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px', fontFamily: 'Cairo' }}>
            {step === 1 ? 'إنشاء حساب جديد' : 'إعداد المحفظة'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, fontFamily: 'Cairo' }}>
            {step === 1 ? 'ابدأ بقبول المدفوعات عبر شام كاش' : 'الخطوة الأخيرة قبل البدء'}
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
        }}>
          {step === 1 ? (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>البريد الإلكتروني</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" dir="ltr" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={16} />
                  </div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    dir="ltr" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>تأكيد كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={16} />
                  </div>
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', height: '46px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '15px', fontWeight: '700', fontFamily: 'Cairo',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)', marginTop: '4px'
              }}>
                {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                إنشاء الحساب
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmAddress} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex', gap: '10px', alignItems: 'flex-start'
              }}>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '13px', color: '#ef4444', fontFamily: 'Cairo', lineHeight: '1.6' }}>
                  <strong>تحذير مهم:</strong> هذا العنوان لن يمكن تغييره أبداً بعد التأكيد. تأكد من صحته قبل المتابعة. سيُستخدم لإرسال سحوباتك إليك.
                </p>
              </div>
              <div>
                <label style={labelStyle}>عنوان محفظة شام كاش</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Wallet size={16} />
                  </div>
                  <input type="text" required value={shamcashAddress} onChange={(e) => setShamcashAddress(e.target.value)}
                    placeholder="efcdc45a4040ac7f4d35b0e8d4df3cde" dir="ltr"
                    style={{ ...inputStyle, fontFamily: 'monospace, Cairo', fontSize: '13px' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', height: '46px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '15px', fontWeight: '700', fontFamily: 'Cairo',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
              }}>
                {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                تأكيد العنوان والمتابعة
              </button>
            </form>
          )}

          {step === 1 && (
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>
              لدي حساب بالفعل؟{' '}
              <Link to="/auth/login" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'none' }}>
                تسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
