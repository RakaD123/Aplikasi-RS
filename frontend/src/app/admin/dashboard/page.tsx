'use client';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import { formatCurrency } from '@/lib/utils';
import { Users, Stethoscope, CreditCard, Calendar, TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminDashboard() {
  const { t } = useI18n();
  const d = t.dashboard;

  const { data: stats, isLoading } = useSWR('/admin/stats', fetcher, { refreshInterval: 5000 });

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>{d.welcome}, Admin 👋</h1>
          <p className={styles.greetingSub}>{d.overview}</p>
        </div>

        <div className={styles.statsGrid}>
          {[
            { icon: <Users size={24} />, value: stats?.total_users?.toLocaleString() || '-', label: d.totalUsers, bg: '#3b5cf815', color: '#3b5cf8', change: '+12%' },
            { icon: <Stethoscope size={24} />, value: stats?.total_doctors?.toLocaleString() || '-', label: d.totalDoctors, bg: '#07c4af15', color: '#07c4af', change: '+3' },
            { icon: <CreditCard size={24} />, value: formatCurrency(stats?.total_revenue || 0), label: d.totalRevenue, bg: '#22c55e15', color: '#22c55e', change: '+18%' },
            { icon: <Calendar size={24} />, value: stats?.active_bookings?.toLocaleString() || '-', label: d.activeBookings, bg: '#f59e0b15', color: '#f59e0b', change: '+5%' },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}><ArrowUpRight size={12} />{s.change}</span>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className={styles.card} style={{ marginBottom: 'var(--space-6)' }}>
          <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.revenue} — {d.last30Days}</h3></div>
          <div className={styles.cardBody}>
            <svg width="100%" height="200" viewBox="0 0 700 200" style={{ overflow: 'visible' }}>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#07c4af" stopOpacity="0.2" /><stop offset="100%" stopColor="#07c4af" stopOpacity="0" /></linearGradient></defs>
              <path d="M0,160 L70,140 L140,150 L210,120 L280,100 L350,110 L420,80 L490,90 L560,60 L630,70 L700,40" fill="none" stroke="#07c4af" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M0,160 L70,140 L140,150 L210,120 L280,100 L350,110 L420,80 L490,90 L560,60 L630,70 L700,40 L700,200 L0,200 Z" fill="url(#revGrad)" />
            </svg>
          </div>
        </div>

        <div className={styles.grid2}>
          {/* Recent Users */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Registrations</h3>
              <Link href="/admin/users"><Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">{t.sections.viewAll}</Button></Link>
            </div>
            <div className={styles.cardBodyNoPad}>
              {isLoading && <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading...</div>}
              {stats?.recent_users?.map((user: any) => (
                <div key={user.id} className={styles.listItem}>
                  <div className={styles.listAvatar}>{user.full_name.charAt(0)}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{user.full_name}</div>
                    <div className={styles.listSub}>Patient · Registered {format(new Date(user.created_at), 'dd MMM yyyy')}</div>
                  </div>
                </div>
              ))}
              {stats?.recent_users?.length === 0 && <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>No users found</div>}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Transactions</h3>
              <Link href="/admin/transactions"><Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">{t.sections.viewAll}</Button></Link>
            </div>
            <div className={styles.cardBodyNoPad}>
              {isLoading && <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading...</div>}
              {stats?.recent_bookings?.map((tx: any) => (
                <div key={tx.id} className={styles.listItem}>
                  <div className={styles.listAvatar}>{tx.patient.full_name.charAt(0)}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{tx.patient.full_name}</div>
                    <div className={styles.listSub}>{formatCurrency(tx.amount)}</div>
                  </div>
                  <span className={`${styles.badge} ${tx.payment_status === 'paid' ? styles.badgeSuccess : styles.badgeWarning}`}>{tx.payment_status === 'paid' ? d.paid : d.pending}</span>
                </div>
              ))}
              {stats?.recent_bookings?.length === 0 && <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>No transactions found</div>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
