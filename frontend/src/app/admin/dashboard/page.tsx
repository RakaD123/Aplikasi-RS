'use client';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useState } from 'react';
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

  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: stats, isLoading } = useSWR(
    `/admin/stats?start_date=${startDate}&end_date=${endDate}`, 
    fetcher, 
    { refreshInterval: 5000 }
  );

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.greeting}>{d.welcome}, Admin 👋</h1>
            <p className={styles.greetingSub}>{d.overview}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', background: 'white', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
            <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', fontSize: 'var(--text-xs)', fontWeight: 600, outline: 'none' }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>—</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', fontSize: 'var(--text-xs)', fontWeight: 600, outline: 'none' }} />
          </div>
        </div>

        <div className={styles.statsGrid}>
          {[
            { icon: <Users size={24} />, value: stats?.total_users?.toLocaleString() || '-', label: d.totalUsers, bg: '#3b5cf815', color: '#3b5cf8', change: '+12%' },
            { icon: <Stethoscope size={24} />, value: stats?.total_doctors?.toLocaleString() || '-', label: d.totalDoctors, bg: '#07c4af15', color: '#07c4af', change: '+3' },
            { icon: <CreditCard size={24} />, value: formatCurrency(stats?.filtered_revenue || 0), label: `${d.revenue} (Periode)`, bg: '#22c55e15', color: '#22c55e', change: '+18%' },
            { icon: <Calendar size={24} />, value: stats?.active_bookings?.toLocaleString() || '-', label: `${d.activeBookings} (Periode)`, bg: '#f59e0b15', color: '#f59e0b', change: '+5%' },
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
          <div className={styles.cardBody} style={{ paddingTop: 'var(--space-8)' }}>
            <div style={{ position: 'relative', height: 240, width: '100%', paddingLeft: 60, paddingBottom: 40 }}>
              {/* Y Axis Labels */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: 50, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right', paddingRight: 10 }}>
                <span>{formatCurrency(Math.max(...(stats?.revenue_daily?.map((r: any) => r.total) || [1000000]), 1000000))}</span>
                <span>{formatCurrency(Math.max(...(stats?.revenue_daily?.map((r: any) => r.total) || [1000000]), 1000000) / 2)}</span>
                <span>Rp 0</span>
              </div>

              <svg width="100%" height="100%" viewBox="0 0 700 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#07c4af" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#07c4af" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Grid Lines */}
                <line x1="0" y1="0" x2="700" y2="0" stroke="var(--gray-100)" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="var(--gray-100)" strokeDasharray="4 4" />
                <line x1="0" y1="200" x2="700" y2="200" stroke="var(--gray-200)" />

                {stats?.revenue_daily?.length > 0 ? (
                  <>
                    <path 
                      d={`M ${stats.revenue_daily.map((r: any, i: number) => {
                        const x = (i / (stats.revenue_daily.length - 1)) * 700;
                        const max = Math.max(...stats.revenue_daily.map((rd: any) => rd.total), 1);
                        const y = 200 - (r.total / max) * 180;
                        return `${x},${y}`;
                      }).join(' L ')}`} 
                      fill="none" 
                      stroke="#07c4af" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d={`M 0,200 L ${stats.revenue_daily.map((r: any, i: number) => {
                        const x = (i / (stats.revenue_daily.length - 1)) * 700;
                        const max = Math.max(...stats.revenue_daily.map((rd: any) => rd.total), 1);
                        const y = 200 - (r.total / max) * 180;
                        return `${x},${y}`;
                      }).join(' L ')} L 700,200 Z`} 
                      fill="url(#revGrad)" 
                    />
                  </>
                ) : (
                  <path d="M0,160 L70,140 L140,150 L210,120 L280,100 L350,110 L420,80 L490,90 L560,60 L630,70 L700,40" fill="none" stroke="#07c4af" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                )}
              </svg>

              {/* X Axis Labels */}
              <div style={{ position: 'absolute', left: 60, right: 0, bottom: 0, height: 30, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', paddingTop: 10 }}>
                {stats?.revenue_daily?.filter((_: any, i: number) => i % 5 === 0 || i === stats.revenue_daily.length - 1).map((r: any, i: number) => (
                  <span key={i}>{format(new Date(r.date), 'dd MMM')}</span>
                ))}
                {!stats?.revenue_daily && (
                  <><span>1 Mei</span><span>10 Mei</span><span>20 Mei</span><span>30 Mei</span></>
                )}
              </div>
            </div>
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
