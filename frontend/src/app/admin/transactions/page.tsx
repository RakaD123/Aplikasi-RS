'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, Search, TrendingUp, CreditCard, FileText } from 'lucide-react';
import Input from '@/components/ui/Input/Input';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminTransactionsPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useSWR(
    `/admin/transactions?search=${search}&status=${statusFilter === 'all' ? '' : statusFilter}`, 
    fetcher
  );
  const transactions = data?.data || [];
  
  // Calculate stats from the current page (or ideally from a separate stats API, but we'll use the fetched array for simplicity here)
  const total = transactions.filter((t: any) => t.payment_status === 'paid').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const paidCount = transactions.filter((t: any) => t.payment_status === 'paid').length;
  const pendingCount = transactions.filter((t: any) => t.payment_status === 'unpaid' || t.payment_status === 'pending').length;

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.greeting}>{d.transactionMonitor}</h1>
          <Button variant="outline" icon={<Download size={16} />}>{d.export}</Button>
        </div>

        <div className={styles.statsGrid}>
          {[
            { icon: <CreditCard size={24} />, label: d.totalRevenue, value: formatCurrency(total), bg: '#22c55e15', color: '#22c55e' },
            { icon: <FileText size={24} />, label: 'Total Transactions', value: transactions.length.toString(), bg: '#3b5cf815', color: '#3b5cf8' },
            { icon: <TrendingUp size={24} />, label: d.paid, value: paidCount.toString(), bg: '#07c4af15', color: '#07c4af' },
            { icon: <CreditCard size={24} />, label: d.pending, value: pendingCount.toString(), bg: '#f59e0b15', color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className={styles.statInfo}><span className={styles.statValue}>{s.value}</span><span className={styles.statLabel}>{s.label}</span></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ flex: 1 }}>
            <Input placeholder="Search by patient or ID..." icon={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['all', 'paid', 'unpaid', 'refunded'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer', background: statusFilter === s ? 'var(--primary-500)' : 'var(--gray-100)', color: statusFilter === s ? 'white' : 'var(--text-secondary)', textTransform: 'capitalize', transition: 'all 0.2s' }}>{s}</button>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardBodyNoPad}>
            {isLoading ? (
               <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading transactions...</div>
            ) : (
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>{d.amount}</th><th>Method</th><th>{d.date}</th><th>{d.status}</th></tr></thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{tx.booking_code || tx.id.split('-')[0]}</td>
                      <td>{tx.patient?.full_name || 'Unknown'}</td>
                      <td>dr. {tx.doctor?.user?.full_name || 'Unknown'}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(parseFloat(tx.amount || 0))}</td>
                      <td><span className={`${styles.badge} ${styles.badgeInfo}`}>{tx.payment_method || '-'}</span></td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{tx.paid_at ? formatDate(tx.paid_at) : formatDate(tx.created_at)}</td>
                      <td>
                        <span className={`${styles.badge} ${tx.payment_status === 'paid' ? styles.badgeSuccess : tx.payment_status === 'unpaid' ? styles.badgeWarning : styles.badgeInfo}`}>
                          {tx.payment_status === 'paid' ? d.paid : tx.payment_status === 'unpaid' ? d.pending : d.refunded}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
