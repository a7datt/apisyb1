import { useAuth } from '../../lib/AuthContext';
import { CheckCircle2, Crown, Zap, Building2 } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'أساسي',
    price: '1$',
    period: 'شهرياً',
    description: 'للمشاريع الصغيرة والبدايات',
    icon: Zap,
    color: '#8888aa',
    accent: 'rgba(136,136,170,0.1)',
    features: ['100 معاملة يومياً', 'API Key واحد', 'سجل المعاملات', 'دعم بالبريد الإلكتروني'],
  },
  {
    id: 'pro',
    name: 'احترافي',
    price: '3$',
    period: 'شهرياً',
    description: 'للمتاجر والمشاريع النشطة',
    icon: Crown,
    color: '#818cf8',
    accent: 'rgba(99,102,241,0.12)',
    featured: true,
    features: ['10,000 معاملة يومياً', 'Webhook تلقائي', 'إحصائيات متقدمة', 'أولوية في الدعم'],
  },
  {
    id: 'custom',
    name: 'مخصص',
    price: 'تواصل معنا',
    period: '',
    description: 'للشركات والمؤسسات الكبيرة',
    icon: Building2,
    color: '#22c55e',
    accent: 'rgba(34,197,94,0.08)',
    features: ['معاملات غير محدودة', 'إعداد خاص', 'دعم مباشر 24/7', 'SLA مضمون'],
  },
];

export default function Subscription() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-in-up">
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px', fontFamily: 'Cairo' }}>الاشتراك</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, fontFamily: 'Cairo' }}>
          خطتك الحالية: <span style={{ color: '#818cf8', fontWeight: '700' }}>
            {profile.plan === 'basic' ? 'أساسي' : profile.plan === 'pro' ? 'احترافي' : 'مخصص'}
          </span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', alignItems: 'start' }}>
        {plans.map((plan) => {
          const isCurrentPlan = profile.plan === plan.id;
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: isCurrentPlan ? `2px solid ${plan.color}` : '1px solid var(--border)',
                borderRadius: '20px',
                padding: '28px',
                position: 'relative',
                transition: 'all 0.2s',
                boxShadow: isCurrentPlan ? `0 8px 32px ${plan.color}20` : 'none',
              }}
              onMouseEnter={e => {
                if (!isCurrentPlan) {
                  (e.currentTarget as HTMLDivElement).style.border = `1px solid ${plan.color}50`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${plan.color}15`;
                }
              }}
              onMouseLeave={e => {
                if (!isCurrentPlan) {
                  (e.currentTarget as HTMLDivElement).style.border = '1px solid var(--border)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }
              }}
            >
              {isCurrentPlan && (
                <div style={{
                  position: 'absolute', top: '-12px', right: '24px',
                  backgroundColor: plan.color, color: 'white',
                  padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', fontFamily: 'Cairo',
                  boxShadow: `0 4px 12px ${plan.color}40`
                }}>
                  خطتك الحالية
                </div>
              )}

              {plan.featured && !isCurrentPlan && (
                <div style={{
                  position: 'absolute', top: '-12px', right: '24px',
                  backgroundColor: '#6366f1', color: 'white',
                  padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', fontFamily: 'Cairo',
                }}>
                  الأكثر شيوعاً
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: plan.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={plan.color} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>{plan.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>{plan.description}</div>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: plan.color, fontFamily: 'Cairo' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'Cairo', marginRight: '4px' }}>{plan.period}</span>}
              </div>

              <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Cairo' }}>
                    <CheckCircle2 size={15} color={plan.color} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrentPlan}
                style={{
                  width: '100%', height: '42px', borderRadius: '12px', border: 'none',
                  backgroundColor: isCurrentPlan ? plan.accent : plan.id === 'custom' ? 'var(--bg-base)' : plan.color,
                  borderWidth: isCurrentPlan ? 0 : plan.id === 'custom' ? '1px' : 0,
                  borderStyle: 'solid',
                  borderColor: plan.id === 'custom' && !isCurrentPlan ? 'var(--border)' : 'transparent',
                  color: isCurrentPlan ? plan.color : 'white',
                  fontSize: '14px', fontWeight: '700', fontFamily: 'Cairo',
                  cursor: isCurrentPlan ? 'default' : 'pointer',
                  opacity: isCurrentPlan ? 0.8 : 1,
                  boxShadow: !isCurrentPlan && plan.id !== 'custom' ? `0 4px 14px ${plan.color}35` : 'none',
                }}
              >
                {isCurrentPlan ? 'خطتك الحالية' : plan.id === 'custom' ? 'تواصل معنا' : 'الترقية الآن'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
