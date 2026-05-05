'use client';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import { Users, ClipboardList, MessageSquare, Calendar, Clock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function DoctorDashboard() {
  const { t } = useI18n();
  const d = t.dashboard;
  const { user } = useAuthStore();

  const { data } = useSWR('/doctor/queue', fetcher, { refreshInterval: 5000 });
  const { data: patientsData } = useSWR('/doctor/patients', fetcher);
  
  const queue = data?.queue?.map((item: any) => ({
    id: item.id,
    name: item.patient_name,
    time: item.appointment_time,
    complaint: item.complaint || 'No complaint specified',
    status: item.booking_status === 'confirmed' ? 'waiting' : item.booking_status === 'in_progress' ? 'inProgress' : item.booking_status
  })) || [];

  const completedToday = queue.filter((q: any) => q.status === 'completed').length;
  const pendingConsults = queue.filter((q: any) => q.status === 'waiting').length;
  const totalPatients = patientsData?.patients?.length || 0;

  return (
    <DashboardLayout role="doctor">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>{d.welcome}, dr. {user?.full_name?.split(' ')[0] || 'Doctor'} 👋</h1>
          <p className={styles.greetingSub}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className={styles.statsGrid}>
          {[
            { icon: <ClipboardList size={24} />, value: queue.length.toString(), label: d.todayQueue, bg: '#3b5cf815', color: '#3b5cf8' },
            { icon: <Users size={24} />, value: totalPatients.toString(), label: d.totalPatients, bg: '#07c4af15', color: '#07c4af' },
            { icon: <MessageSquare size={24} />, value: pendingConsults.toString(), label: d.pendingConsults, bg: '#f59e0b15', color: '#f59e0b' },
            { icon: <CheckCircle size={24} />, value: completedToday.toString(), label: d.completedToday, bg: '#22c55e15', color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className={styles.statInfo}><span className={styles.statValue}>{s.value}</span><span className={styles.statLabel}>{s.label}</span></div>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>
          {/* Today's Queue */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{d.todayQueue}</h3>
              <Link href="/doctor/queue"><Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">{t.sections.viewAll}</Button></Link>
            </div>
            <div className={styles.cardBodyNoPad}>
              {queue.slice(0, 5).map((patient: any) => (
                <div key={patient.id} className={styles.listItem}>
                  <div className={styles.listAvatar}>{getInitials(patient.name)}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{patient.name}</div>
                    <div className={styles.listSub}>{patient.complaint} · <Clock size={10} /> {patient.time}</div>
                  </div>
                  <span className={`${styles.badge} ${patient.status === 'completed' ? styles.badgeSuccess : patient.status === 'inProgress' ? styles.badgeWarning : styles.badgeInfo}`}>
                    {patient.status === 'completed' ? d.completed : patient.status === 'inProgress' ? d.inProgress : d.waiting}
                  </span>
                </div>
              ))}
              {queue.length === 0 && <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Tidak ada antrean hari ini.</div>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.quickActions}</h3></div>
            <div className={styles.cardBody}>
              <div className={styles.quickActions}>
                {[
                  { icon: <ClipboardList size={22} />, label: d.patientQueue, href: '/doctor/queue', bg: '#3b5cf815', color: '#3b5cf8' },
                  { icon: <Users size={22} />, label: d.patientRecords, href: '/doctor/patients', bg: '#07c4af15', color: '#07c4af' },
                  { icon: <MessageSquare size={22} />, label: d.consultations, href: '/doctor/consultations', bg: '#8b5cf615', color: '#8b5cf6' },
                  { icon: <Calendar size={22} />, label: d.mySchedule, href: '/doctor/schedule', bg: '#f59e0b15', color: '#f59e0b' },
                ].map((a, i) => (
                  <Link key={i} href={a.href} className={styles.quickAction}>
                    <div className={styles.quickActionIcon} style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                    <span className={styles.quickActionLabel}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
