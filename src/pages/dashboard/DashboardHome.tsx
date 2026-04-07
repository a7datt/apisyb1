import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DollarSign, Banknote, Activity, Crown, ArrowLeft, TrendingUp } from 'lucide-react';
import { getStatusLabel, getStatusClass } from '../../lib/utils';

const StatCard = ({ title, value, icon: Icon, accent, subtitle }: any) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '18px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    transition: 'all 0.2s',
    cursor: 'default',
  }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.border = `1px solid ${accent}40`;
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${accent}15`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.border = '1px solid var(--border)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Cairo', fontWeight: '500' }}>{title}</span>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={accent} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Cairo', lineHeight: 1 }}>{value}</div>
      {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'Cairo' }}>{subtitle}</div>}
    </div>
  </div>
);

export default function DashboardHome() {
  const { profile } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentTransactions(data);
      setLoading(false);
    };
    fetchTransactions();
  }, [profile]);

  if (!profile) return null;

  const limit = profile.plan === 'pro' ? 10000 : profile.plan === 'custom' ? Infinity : 100;
  const progress = limit === Infinity ? 0 : Math.min((profile.daily_count / limit) * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'Cairo' }}>نظرة عامة</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, fontFamily: 'Cairo' }}>
          {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <StatCard
          title="الرصيد بالدولار"
          value={`$${Number(profile.balance_usd || 0).toFixed(2)}`}
          icon={DollarSign}
          accent="#22c55e"
        />
        <StatCard
          title="الرصيد بالليرة"
          value={`${Number(profile.balance_syp || 0).toLocaleString('ar')} ل.س`}
          icon={Banknote}
          accent="#3b82f6"
        />
        <StatCard
          title="معاملات اليوم"
          value={`${profile.daily_count}`}
          icon={Activity}
          accent="#f59e0b"
          subtitle={limit === Infinity ? 'غير محدود' : `من ${limit} معاملة`}
        />
        <StatCard
          title="الخطة الحالية"
          value={profile.plan === 'basic' ? 'أساسي' : profile.plan === 'pro' ? 'احترافي' : 'مخصص'}
          icon={Crown}
          accent="#818cf8"
        />
      </div>

      {/* Daily Usage Bar */}
      {limit !== Infinity && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} /> الحد اليومي للمعاملات
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>
              {profile.daily_count} / {limit}
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--bg-base)', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: progress > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #6366f1, #818cf8)',
              borderRadius: '100px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cairo' }}>آخر المعاملات</h2>
          <Link to="/dashboard/transactions" style={{
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#818cf8',
            textDecoration: 'none', fontFamily: 'Cairo', fontWeight: '600'
          }}>
            عرض الكل <ArrowLeft size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>
            <div className="skeleton" style={{ height: '16px', width: '200px', margin: '0 auto 12px' }} />
            <div className="skeleton" style={{ height: '16px', width: '160px', margin: '0 auto' }} />
          </div>
        ) : recentTransactions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>
            لا توجد معاملات حتى الآن
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['رقم الفاتورة', 'المبلغ', 'العملة', 'الحالة', 'التاريخ'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{tx.id.substring(0, 8)}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{tx.original_amount}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{tx.currency}</td>
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                      <span className={`badge ${getStatusClass(tx.status)}`}>{getStatusLabel(tx.status)}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }} dir="ltr">
                      {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
