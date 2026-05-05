'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import { Plus, Bell, Pill, TestTube, Calendar } from 'lucide-react';

const mockReminders = [
  { id: '1', title: 'Paracetamol 500mg', type: 'medication', frequency: 'daily', time: '08:00', active: true },
  { id: '2', title: 'Cek Gula Darah', type: 'labCheck', frequency: 'weekly', time: '07:00', active: true },
  { id: '3', title: 'Vitamin D 1000IU', type: 'medication', frequency: 'daily', time: '12:00', active: true },
  { id: '4', title: 'Medical Check-Up', type: 'labCheck', frequency: 'once', time: '09:00', active: false },
  { id: '5', title: 'Amoxicillin 250mg', type: 'medication', frequency: 'daily', time: '20:00', active: true },
];

export default function RemindersPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [showModal, setShowModal] = useState(false);
  const [reminders, setReminders] = useState(mockReminders);

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.greeting}>{d.reminders}</h1>
            <p className={styles.greetingSub}>{reminders.filter(r => r.active).length} {d.active}</p>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>{d.addReminder}</Button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardBodyNoPad}>
            {reminders.map(reminder => (
              <div key={reminder.id} className={styles.listItem} style={{ opacity: reminder.active ? 1 : 0.5 }}>
                <div className={styles.listAvatar} style={{ background: reminder.type === 'medication' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                  {reminder.type === 'medication' ? <Pill size={18} /> : <TestTube size={18} />}
                </div>
                <div className={styles.listInfo}>
                  <div className={styles.listName}>{reminder.title}</div>
                  <div className={styles.listSub} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {reminder.frequency === 'daily' ? d.daily : reminder.frequency === 'weekly' ? d.weekly : d.once}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Bell size={12} /> {reminder.time}</span>
                  </div>
                </div>
                <button className={`${styles.toggle} ${reminder.active ? styles.toggleOn : ''}`} onClick={() => toggleReminder(reminder.id)}>
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={d.addReminder}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formFull}`}><Input label={d.reminderTitle} placeholder="Paracetamol 500mg" /></div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Type</label>
              <select style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <option value="medication">{d.medication}</option><option value="labCheck">{d.labCheck}</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.frequency}</label>
              <select style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <option value="daily">{d.daily}</option><option value="weekly">{d.weekly}</option><option value="once">{d.once}</option>
              </select>
            </div>
            <div className={styles.formGroup}><Input label={d.time} type="time" /></div>
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>{t.common.save}</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
