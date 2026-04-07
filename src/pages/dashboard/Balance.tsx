import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { DollarSign, Banknote, X, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getStatusClass } from '../../lib/utils';

export default function Balance() {
  const { profile, refreshProfile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; currency: string; amount: number }>({ show: false, currency: '', amount: 0 });

  const fetchWithdrawals = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', profile.id)
      .order('requested_at', { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => { fetchWithdrawals(); }, [profile]);

  const handleWithdrawRequest = async () => {
    if (!profile) return;
    setWithdrawing(true);
    const { currency, amount } = modal;

    const { error } = await supabase.from('withdrawals').insert({
      user_id: profile.id,
      amount,
      currency,
      shamcash_address: profile.shamcash_address,
      status: 'pending',
    });

    if (error) {
      toast.error('حدث خطأ أثناء طلب السحب');
    } else {
      const balanceField = currency === 'دولار' ? 'balance_usd' : 'balance_syp';
      await supabase.from('profiles').update({ [balanceField]: 0 }).eq('id', profile.id);
      toast.success('تم إرسال طلب السحب بنجاح');
      setModal({ show: false, currency: '', amount: 0 });
      await refreshProfile();
      await fetchWithdrawals();
    }
    setWithdrawing(false);
  };

  if (!profile) return null;

  const statusLabel: Record<string, string> = { pending: 'قيد المعالجة', completed: 'مكتمل', rejected: 'مرفوض' };
  const StatusIcon = ({ s }: { s: string }) =>
    s === 'completed' ? <CheckCircle2 size={14} color="#22c55e" /> :
    s === 'pending' ? <Clock size={14} color="#f59e0b" /> :
    <XCircle size={14} color="#ef4444" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in-up">
      <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cairo' }}>الرصيد والسحب</h1>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* USD */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="#22c55e" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', fontFamily: 'Cairo' }}>الرصيد بالدولار</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>متاح للسحب</div>
            </div>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#22c55e', fontFamily: 'Cairo', marginBottom: '20px' }}>
            ${Number(profile.balance_usd || 0).toFixed(2)}
          </div>
          <button
            onClick={() => setModal({ show: true, currency: 'دولار', amount: Number(profile.balance_usd) })}
            disabled={Number(profile.balance_usd) <= 0}
            style={{
              width: '100%', height: '42px', borderRadius: '12px',
              background: Number(profile.balance_usd) > 0 ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--bg-base)',
              border: Number(profile.balance_usd) > 0 ? 'none' : '1px solid var(--border)',
              color: Number(profile.balance_usd) > 0 ? 'white' : 'var(--text-muted)',
              fontSize: '14px', fontWeight: '700', fontFamily: 'Cairo', cursor: Number(profile.balance_usd) > 0 ? 'pointer' : 'not-allowed',
              boxShadow: Number(profile.balance_usd) > 0 ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            }}>
            طلب سحب بالدولار
          </button>
        </div>

        {/* SYP */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', fontFamily: 'Cairo' }}>الرصيد بالليرة السورية</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>متاح للسحب</div>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6', fontFamily: 'Cairo', marginBottom: '20px' }}>
            {Number(profile.balance_syp || 0).toLocaleString('ar')} ل.س
          </div>
          <button
            onClick={() => setModal({ show: true, currency: 'ليرة سورية', amount: Number(profile.balance_syp) })}
            disabled={Number(profile.balance_syp) <= 0}
            style={{
              width: '100%', height: '42px', borderRadius: '12px',
              background: Number(profile.balance_syp) > 0 ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--bg-base)',
              border: Number(profile.balance_syp) > 0 ? 'none' : '1px solid var(--border)',
              color: Number(profile.balance_syp) > 0 ? 'white' : 'var(--text-muted)',
              fontSize: '14px', fontWeight: '700', fontFamily: 'Cairo', cursor: Number(profile.balance_syp) > 0 ? 'pointer' : 'not-allowed',
              boxShadow: Number(profile.balance_syp) > 0 ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            }}>
            طلب سحب بالليرة
          </button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cairo' }}>سجل طلبات السحب</h2>
        </div>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="skeleton" style={{ height: '16px', width: '220px', margin: '0 auto' }} />
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>لا توجد طلبات سحب سابقة</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['التاريخ', 'المبلغ', 'العملة', 'الحالة'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    style={{ transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }} dir="ltr">
                      {format(new Date(w.requested_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{Number(w.amount).toLocaleString()}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{w.currency}</td>
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontFamily: 'Cairo', fontWeight: '600', backgroundColor: w.status === 'completed' ? 'rgba(34,197,94,0.1)' : w.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: w.status === 'completed' ? '#22c55e' : w.status === 'pending' ? '#f59e0b' : '#ef4444', border: `1px solid ${w.status === 'completed' ? 'rgba(34,197,94,0.2)' : w.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <StatusIcon s={w.status} />
                        {statusLabel[w.status] || w.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {modal.show && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '24px' }}>
          <div className="animate-fade-in-up" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cairo' }}>تأكيد طلب السحب</h3>
              <button onClick={() => setModal({ show: false, currency: '', amount: 0 })} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Cairo' }}>المبلغ المطلوب</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>
                  {modal.currency === 'دولار' ? `$${modal.amount.toFixed(2)}` : `${modal.amount.toLocaleString()} ل.س`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Cairo' }}>عنوان المحفظة</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#818cf8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="ltr">
                  {profile.shamcash_address}
                </span>
              </div>
              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', fontSize: '13px', color: '#818cf8', fontFamily: 'Cairo' }}>
                سيتم إرسال المبلغ لمحفظتك خلال 24 ساعة من تأكيد الطلب.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleWithdrawRequest} disabled={withdrawing} style={{
                flex: 1, height: '44px', background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', fontFamily: 'Cairo',
                cursor: withdrawing ? 'not-allowed' : 'pointer', opacity: withdrawing ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {withdrawing && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                تأكيد الطلب
              </button>
              <button onClick={() => setModal({ show: false, currency: '', amount: 0 })} disabled={withdrawing} style={{
                flex: 1, height: '44px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', fontFamily: 'Cairo', cursor: 'pointer',
              }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
