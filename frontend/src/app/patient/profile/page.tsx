'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { User, Lock, Shield, Save } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'security'>('personal');

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>{d.profile}</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {[{ v: 'personal' as const, l: d.personalInfo, icon: <User size={16} /> }, { v: 'medical' as const, l: d.medicalProfile, icon: <Shield size={16} /> }, { v: 'security' as const, l: d.changePassword, icon: <Lock size={16} /> }].map(tab => (
            <button key={tab.v} onClick={() => setActiveTab(tab.v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === tab.v ? 'var(--primary-500)' : 'var(--gray-100)', color: activeTab === tab.v ? 'white' : 'var(--text-secondary)' }}>{tab.icon} {tab.l}</button>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardBody}>
            {activeTab === 'personal' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><Input label={t.auth.fullName} value={user?.full_name || ''} /></div>
                <div className={styles.formGroup}><Input label={t.auth.email} value={user?.email || ''} /></div>
                <div className={styles.formGroup}><Input label={t.auth.phone} value={user?.phone_number || ''} /></div>
                <div className={styles.formGroup}><Input label="Date of Birth" type="date" value="1990-01-15" /></div>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Gender</label>
                  <select style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Address" value="Jl. Contoh No. 123, Jakarta Selatan" /></div>
                <div className={`${styles.formActions} ${styles.formFull}`}><Button variant="primary" icon={<Save size={16} />}>{t.common.save}</Button></div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.bloodType}</label>
                  <select style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                  </select>
                </div>
                <div className={styles.formGroup}><Input label={d.weight + ' (kg)'} value="68" /></div>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label={d.allergies} value="Penicillin, Seafood" /></div>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label={d.medicalHistory} value="Diabetes Type 2 (controlled)" /></div>
                <div className={`${styles.formActions} ${styles.formFull}`}><Button variant="primary" icon={<Save size={16} />}>{t.common.save}</Button></div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Current Password" type="password" /></div>
                <div className={styles.formGroup}><Input label={t.auth.newPassword} type="password" /></div>
                <div className={styles.formGroup}><Input label={t.auth.confirmPassword} type="password" /></div>
                <div className={`${styles.formActions} ${styles.formFull}`}><Button variant="primary" icon={<Save size={16} />}>{d.changePassword}</Button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
