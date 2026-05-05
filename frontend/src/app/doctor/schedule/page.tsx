'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import { Plus, Clock, Calendar, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchedulePage() {
  const { t } = useI18n();
  const d = t.dashboard;
  
  const { data, mutate } = useSWR('/doctor/schedule', fetcher);
  const rawSchedules = data?.schedules || [];

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '12:00',
    hospital_branch: 'RS Digital Jakarta Pusat'
  });

  // Group schedules by day
  const scheduleByDay = weekDays.map(day => ({
    day,
    slots: rawSchedules.filter((s: any) => s.day_of_week === day).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
  }));

  const handleAdd = async () => {
    setLoading(true);
    try {
      await api.post('/doctor/schedule', formData);
      mutate();
      setShowModal(false);
      setFormData({
        ...formData,
        start_time: '08:00',
        end_time: '12:00'
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus slot jadwal ini?')) return;
    try {
      await api.delete(`/doctor/schedule/${id}`);
      mutate();
    } catch (err: any) {
      alert('Failed to delete schedule');
    }
  };

  return (
    <DashboardLayout role="doctor">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1 className={styles.greeting}>{d.mySchedule}</h1><p className={styles.greetingSub}>{d.manageSlots}</p></div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Add Slot</Button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardBodyNoPad}>
            <table className={styles.table}>
              <thead><tr><th>Day</th><th>{d.time}</th><th>{d.branch}</th><th></th></tr></thead>
              <tbody>
                {scheduleByDay.map(day => (
                  day.slots.length > 0 ? day.slots.map((slot: any, i: number) => (
                    <tr key={slot.id || `${day.day}-${i}`}>
                      <td style={{ fontWeight: 600 }}>{i === 0 ? day.day : ''}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</span></td>
                      <td>{slot.hospital_branch}</td>
                      <td><Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(slot.id)} /></td>
                    </tr>
                  )) : (
                    <tr key={day.day}>
                      <td style={{ fontWeight: 600 }}>{day.day}</td>
                      <td colSpan={3} style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No schedule</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Schedule Slot">
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Day</label>
              <select 
                value={formData.day_of_week}
                onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                {weekDays.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.branch}</label>
              <select 
                value={formData.hospital_branch}
                onChange={e => setFormData({...formData, hospital_branch: e.target.value})}
                style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <option value="RS Digital Jakarta Pusat">RS Digital Jakarta Pusat</option>
                <option value="RS Digital Jakarta Selatan">RS Digital Jakarta Selatan</option>
                <option value="RS Digital Tangerang">RS Digital Tangerang</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <Input label="Start Time" type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <Input label="End Time" type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
            </div>
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" loading={loading} onClick={handleAdd}>{t.common.save}</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
