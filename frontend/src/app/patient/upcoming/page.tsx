'use client';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import { format } from 'date-fns';
import { Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function UpcomingAppointmentsPage() {
  const { t } = useI18n();
  const d = t.dashboard;

  const { data } = useSWR('/patient/bookings', fetcher);
  const bookings = data?.data || [];

  // Find all upcoming appointments (pending or confirmed)
  const upcomingAppointments = bookings
    .filter((b: any) => ['pending', 'confirmed'].includes(b.booking_status))
    .sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>Jadwal Mendatang</h1>
          <p className={styles.greetingSub}>Daftar semua jadwal konsultasi Anda yang akan datang.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Semua Jadwal Mendatang</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-tertiary)' }}>
              <CalendarIcon size={16} />
              <span>{upcomingAppointments.length} Jadwal</span>
            </div>
          </div>
          
          <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt: any) => (
                <div key={apt.id} style={{ 
                  padding: 'var(--space-5)', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '4px solid var(--primary-500)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div className={styles.listAvatar}>{apt.doctor.user.full_name.charAt(0)}</div>
                      <div className={styles.listInfo}>
                        <div className={styles.listName} style={{ fontSize: 'var(--text-lg)' }}>dr. {apt.doctor.user.full_name}</div>
                        <div className={styles.listSub}>{apt.doctor.specialization || 'Umum'}</div>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${apt.booking_status === 'confirmed' ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {apt.booking_status}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: 'var(--space-6)', 
                    marginTop: 'var(--space-5)', 
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border-light)',
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Clock size={16} color="var(--primary-500)" /> 
                      {format(new Date(apt.appointment_time), 'EEEE, dd MMM yyyy • HH:mm')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <MapPin size={16} color="var(--primary-500)" /> 
                      RS Digital Pusat
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 'var(--space-8) 0', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                <CalendarIcon size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.2 }} />
                <p>Tidak ada jadwal appointment mendatang.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
