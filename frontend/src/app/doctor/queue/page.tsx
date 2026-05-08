'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import { getInitials } from '@/lib/utils';
import { Phone, Clock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function QueuePage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [filter, setFilter] = useState('all');

  const { data, mutate, isLoading } = useSWR('/doctor/queue', fetcher, { refreshInterval: 5000 });
  const queue = data?.queue?.map((item: any) => ({
    id: item.id,
    name: item.patient_name,
    time: item.appointment_time,
    complaint: item.complaint || 'No complaint specified',
    status: item.booking_status === 'confirmed' ? 'waiting' : item.booking_status === 'in_progress' ? 'inProgress' : item.booking_status
  })) || [];

  const callNext = async () => {
    const inProg = queue.find((q: any) => q.status === 'inProgress');
    if (inProg) {
      await api.put(`/doctor/queue/${inProg.id}/status`, { status: 'completed' });
    }
    const nextWaiting = queue.find((q: any) => q.status === 'waiting');
    if (nextWaiting) {
      await api.put(`/doctor/queue/${nextWaiting.id}/status`, { status: 'in_progress' });
    }
    mutate(); // Refresh SWR data
  };

  const filtered = filter === 'all' ? queue : queue.filter((q: any) => q.status === filter);

  return (
    <DashboardLayout role="doctor">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.greeting}>{d.patientQueue}</h1>
            <p className={styles.greetingSub}>
              {new Date(data?.date || new Date()).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {queue.filter((q: any) => q.status === 'waiting').length} {d.waiting}
            </p>
          </div>
          <Button variant="accent" onClick={callNext} icon={<ArrowRight size={16} />}>{d.callNext}</Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {['all', 'waiting', 'inProgress', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f ? 'var(--primary-500)' : 'var(--gray-100)', color: filter === f ? 'white' : 'var(--text-secondary)' }}>
              {f === 'all' ? 'All' : f === 'waiting' ? d.waiting : f === 'inProgress' ? d.inProgress : d.completed} ({queue.filter(q => f === 'all' || q.status === f).length})
            </button>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardBodyNoPad}>
            {isLoading && <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading queue...</div>}
            {filtered.map((patient: any, idx: number) => (
              <div key={patient.id} className={styles.listItem} style={{ padding: 'var(--space-4) var(--space-5)', background: patient.status === 'inProgress' ? 'var(--primary-50)' : undefined }}>
                <div style={{ width: 32, textAlign: 'center', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-tertiary)' }}>#{idx + 1}</div>
                <div className={styles.listAvatar}>{getInitials(patient.name)}</div>
                <div className={styles.listInfo}>
                  <div className={styles.listName}>{patient.name}</div>
                  <div className={styles.listSub}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {patient.complaint}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 12 }}><Clock size={12} /> {patient.time}</span>
                  </div>
                </div>
                <span className={`${styles.badge} ${patient.status === 'completed' ? styles.badgeSuccess : patient.status === 'inProgress' ? styles.badgeWarning : styles.badgeInfo}`}>
                  {patient.status === 'completed' ? d.completed : patient.status === 'inProgress' ? d.inProgress : d.waiting}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <AlertCircle size={40} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                <p>Tidak ada antrean pasien untuk tanggal ini.</p>
                <p style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>Pastikan jadwal pasien sudah sesuai dengan tanggal hari ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
