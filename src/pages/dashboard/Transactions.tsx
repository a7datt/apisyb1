import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Filter, ChevronRight, ChevronLeft } from 'lucide-react';
import { getStatusLabel, getStatusClass } from '../../lib/utils';

const selectStyle = {
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '8px 14px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'Cairo',
  outline: 'none',
  cursor: 'pointer',
};

export default function Transactions() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');

  const fetchTransactions = async (p = page) => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range((p - 1) * 20, p * 20 - 1);

    if (statusFilter) query = query.eq('status', statusFilter);
    if (currencyFilter) query = query.eq('currency', currencyFilter);

    const { data, count } = await query;
    if (data) setTransactions(data);
    if (count !== null) setTotalPages(Math.ceil(count / 20));
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [profile, page]);

  const handleFilter = () => { setPage(1); fetchTransactions(1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in-up">
      <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cairo' }}>المعاملات</h1>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'Cairo' }}>
            <Filter size={14} /> فلترة:
          </div>
          <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="pending">معلقة</option>
            <option value="paid">مدفوعة</option>
            <option value="expired">منتهية</option>
            <option value="rejected">مرفوضة</option>
            <option value="withdrawn">تم السحب</option>
          </select>
          <select style={selectStyle} value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}>
            <option value="">كل العملات</option>
            <option value="دولار">دولار</option>
            <option value="ليرة سورية">ليرة سورية</option>
          </select>
          <button onClick={handleFilter} style={{
            padding: '8px 16px', backgroundColor: '#6366f1', border: 'none', borderRadius: '10px',
            color: 'white', fontSize: '13px', fontFamily: 'Cairo', fontWeight: '600', cursor: 'pointer'
          }}>
            تطبيق
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="skeleton" style={{ height: '16px', width: '240px', margin: '0 auto 12px' }} />
            <div className="skeleton" style={{ height: '16px', width: '200px', margin: '0 auto' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Cairo' }}>
            لا توجد معاملات مطابقة
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['رقم الفاتورة', 'المبلغ الأصلي', 'المبلغ الفريد', 'العملة', 'الحالة', 'تاريخ الإنشاء', 'تاريخ الدفع'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    style={{ transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '12px', color: '#818cf8', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{tx.id.substring(0, 8)}</td>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo' }}>{tx.original_amount}</td>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '13px', color: '#22c55e', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{tx.unique_amount}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo', whiteSpace: 'nowrap' }}>{tx.currency}</td>
                    <td style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span className={`badge ${getStatusClass(tx.status)}`}>{getStatusLabel(tx.status)}</span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo', whiteSpace: 'nowrap' }} dir="ltr">
                      {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'Cairo', whiteSpace: 'nowrap' }} dir="ltr">
                      {tx.paid_at ? format(new Date(tx.paid_at), 'dd/MM/yyyy HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '10px', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', fontFamily: 'Cairo', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronRight size={14} /> السابق
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Cairo' }}>
            صفحة {page} من {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '10px', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', fontFamily: 'Cairo', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            التالي <ChevronLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
