'use client';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import Button from '@/components/ui/Button/Button';
import { Calendar, Activity, Bell, CreditCard, MessageSquare, ArrowRight, Clock, MapPin, CheckCircle } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function PatientDashboard() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const d = t.dashboard;

  const { data: bookingsData } = useSWR('/patient/bookings', fetcher);
  const { data: remindersData } = useSWR('/patient/reminders', fetcher);
  const { data: healthLogsData } = useSWR('/patient/health-logs', fetcher);

  const bookings = bookingsData?.data || [];
  const reminders = remindersData?.reminders || [];
  const healthLogs = healthLogsData?.logs || [];

  const completedVisits = bookings.filter((b: any) => b.booking_status === 'completed').length;
  const activeReminders = reminders.filter((r: any) => r.is_active).length;
  
  // Find upcoming appointments (any active booking that hasn't been completed or cancelled)
  const upcomingAppointments = bookings
    .filter((b: any) => ['pending', 'confirmed'].includes(b.booking_status))
    .sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
    
  const upcomingAppointment = upcomingAppointments[0]; // Just show the first one on dashboard

  // Calculate dynamic health score
  const calculateHealthScore = (logs: any[]) => {
    if (!logs || logs.length === 0) return '-';
    let score = 100;
    
    // get latest logs by metric
    const latestLogs: Record<string, any> = {};
    logs.forEach(l => {
      if (!latestLogs[l.metric_type] || new Date(l.recorded_at) > new Date(latestLogs[l.metric_type].recorded_at)) {
        latestLogs[l.metric_type] = l;
      }
    });

    if (latestLogs.bloodPressure) {
      const parts = latestLogs.bloodPressure.value.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0]);
        if (sys > 140) score -= 15;
        else if (sys > 120) score -= 5;
        else if (sys < 90) score -= 10;
      }
    }
    
    if (latestLogs.bloodSugar) {
      const val = parseFloat(latestLogs.bloodSugar.value);
      if (val > 200) score -= 15;
      else if (val > 140) score -= 10;
      else if (val < 70) score -= 10;
    }

    if (latestLogs.heartRate) {
      const val = parseFloat(latestLogs.heartRate.value);
      if (val > 100) score -= 10;
      else if (val < 60) score -= 5;
    }

    if (latestLogs.cholesterol) {
      const val = parseFloat(latestLogs.cholesterol.value);
      if (val > 240) score -= 15;
      else if (val > 200) score -= 5;
    }

    return Math.max(0, Math.min(100, score)).toString();
  };

  const healthScore = calculateHealthScore(healthLogs);

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>{d.welcome}, {user?.full_name?.split(' ')[0] || 'User'} 👋</h1>
          <p className={styles.greetingSub}>{d.bookNowDesc}</p>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { icon: <Calendar size={24} />, value: bookings.length.toString(), label: d.totalBookings, bg: '#3b5cf815', color: '#3b5cf8' },
            { icon: <CheckCircle size={24} />, value: completedVisits.toString(), label: d.completedVisits, bg: '#22c55e15', color: '#22c55e' },
            { icon: <Bell size={24} />, value: activeReminders.toString(), label: d.activeReminders, bg: '#f59e0b15', color: '#f59e0b' },
            { icon: <Activity size={24} />, value: healthScore, label: d.healthScore, bg: '#07c4af15', color: '#07c4af' },
          ].map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>
          {/* Upcoming Appointment */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{d.upcomingAppointment}</h3>
              <Link href="/patient/upcoming"><Button variant="ghost" size="sm">{t.sections.viewAll}</Button></Link>
            </div>
            <div className={styles.cardBody}>
              {upcomingAppointment ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div className={styles.listAvatar}>{upcomingAppointment.doctor.user.full_name.charAt(0)}</div>
                    <div className={styles.listInfo}>
                      <div className={styles.listName}>dr. {upcomingAppointment.doctor.user.full_name}</div>
                      <div className={styles.listSub}>{upcomingAppointment.doctor.specialization || 'Umum'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {format(new Date(upcomingAppointment.appointment_time), 'dd MMM yyyy, HH:mm')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> RS Digital Pusat</span>
                  </div>
                </>
              ) : (
                <div style={{ padding: 'var(--space-4) 0', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  Tidak ada jadwal appointment mendatang.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{d.quickActions}</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.quickActions}>
                {[
                  { icon: <Calendar size={22} />, label: d.bookDoctor, href: '/patient/booking', bg: '#3b5cf815', color: '#3b5cf8' },
                  { icon: <Activity size={22} />, label: d.healthLog, href: '/patient/health-monitor', bg: '#07c4af15', color: '#07c4af' },
                  { icon: <MessageSquare size={22} />, label: d.startConsult, href: '/patient/consultations', bg: '#8b5cf615', color: '#8b5cf6' },
                  { icon: <CreditCard size={22} />, label: d.viewHistory, href: '/patient/transactions', bg: '#f59e0b15', color: '#f59e0b' },
                ].map((action, i) => (
                  <Link key={i} href={action.href} className={styles.quickAction}>
                    <div className={styles.quickActionIcon} style={{ background: action.bg, color: action.color }}>{action.icon}</div>
                    <span className={styles.quickActionLabel}>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{d.recentActivity}</h3>
          </div>
          <div className={styles.cardBodyNoPad}>
            {bookings.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listAvatar}>{item.doctor.user.full_name.charAt(0)}</div>
                <div className={styles.listInfo}>
                  <div className={styles.listName}>dr. {item.doctor.user.full_name}</div>
                  <div className={styles.listSub}>Consultation {item.booking_status}</div>
                </div>
                <span className={`${styles.badge} ${styles.badgeInfo}`}>{item.booking_status}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {format(new Date(item.created_at), 'MMM dd')}
                </span>
              </div>
            ))}
            {bookings.length === 0 && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                Belum ada aktivitas.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
