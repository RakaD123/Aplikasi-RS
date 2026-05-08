'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Modal from '@/components/ui/Modal/Modal';
import { getInitials } from '@/lib/utils';
import { Plus, Edit2, Search, Star, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import ConfirmModal from '@/components/ui/Modal/ConfirmModal';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminDoctorsPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create State
  const [newDoctor, setNewDoctor] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    specialization: 'Penyakit Dalam',
    hospital_branch: 'RS Digital Jakarta Pusat',
    experience_years: '',
    consultation_fee: '150000'
  });

  // Edit State
  const [editDoctor, setEditDoctor] = useState<any>(null);
  const [editFee, setEditFee] = useState('');
  const [editSpec, setEditSpec] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editExp, setEditExp] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const { data, mutate, isLoading } = useSWR(`/admin/doctors?search=${search}`, fetcher);
  const doctors = data?.data || [];

  const [confirmState, setConfirmState] = useState<{isOpen: boolean, doctorId: string, status: boolean, name: string}>({
    isOpen: false,
    doctorId: '',
    status: false,
    name: ''
  });

  const handleToggleStatus = async (doctorId: string, currentStatus: boolean, name: string) => {
    setConfirmState({ isOpen: true, doctorId, status: currentStatus, name });
  };

  const executeToggle = async () => {
    setSavingEdit(true);
    try {
      await api.put(`/admin/doctors/${confirmState.doctorId}/toggle`);
      mutate();
      setConfirmState({ ...confirmState, isOpen: false });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update doctor status');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editDoctor) return;
    setSavingEdit(true);
    try {
      await api.put(`/admin/doctors/${editDoctor.id}`, {
        consultation_fee: editFee,
        specialization: editSpec,
        hospital_branch: editBranch,
        experience_years: parseInt(editExp) || 0
      });
      setEditDoctor(null);
      mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update doctor');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateSubmit = async () => {
    setSavingEdit(true);
    try {
      await api.post(`/admin/doctors`, {
        ...newDoctor,
        experience_years: parseInt(newDoctor.experience_years) || 0
      });
      setShowModal(false);
      setNewDoctor({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        specialization: 'Penyakit Dalam',
        hospital_branch: 'RS Digital Jakarta Pusat',
        experience_years: '',
        consultation_fee: '150000'
      });
      mutate();
      alert('Akun dokter berhasil dibuat!');
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat().join('\n');
        alert(`Gagal menyimpan:\n${msgs}`);
      } else {
        alert(err.response?.data?.message || 'Gagal membuat akun dokter');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditModal = (doc: any) => {
    setEditDoctor(doc);
    setEditFee(doc.consultation_fee || '');
    setEditSpec(doc.specialization || '');
    setEditBranch(doc.hospital_branch || '');
    setEditExp(doc.experience_years?.toString() || '0');
  };

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.greeting}>{d.doctorManagement}</h1>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>{d.addDoctor}</Button>
        </div>

        <div className={styles.card}>
          <div style={{ padding: 'var(--space-3) var(--space-5)' }}>
            <Input placeholder={t.doctorSearch.searchPlaceholder} icon={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.cardBodyNoPad}>
            {isLoading ? (
               <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading doctors...</div>
            ) : (
              <table className={styles.table}>
                <thead><tr><th>Doctor</th><th>{d.specialization}</th><th>{d.branch}</th><th>Rating</th><th>{d.status}</th><th>Actions</th></tr></thead>
                <tbody>
                  {doctors.map((doc: any) => (
                    <tr key={doc.id} style={{ opacity: doc.is_active ? 1 : 0.6 }}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><div className={styles.listAvatar} style={{ width: 32, height: 32, fontSize: 'var(--text-xs)' }}>{getInitials(doc.user?.full_name || '')}</div>dr. {doc.user?.full_name}</div></td>
                      <td>{doc.specialization}</td>
                      <td>{doc.hospital_branch}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="#f59e0b" color="#f59e0b" />{doc.rating}</span></td>
                      <td><span className={`${styles.badge} ${doc.is_active ? styles.badgeSuccess : styles.badgeDanger}`}>{doc.is_active ? d.active : d.inactive}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => openEditModal(doc)} />
                          <Button variant="ghost" size="sm" icon={doc.is_active ? <ShieldAlert size={14} color="var(--danger-500)" /> : <ShieldCheck size={14} color="var(--success-500)" />} onClick={() => handleToggleStatus(doc.id, doc.is_active, doc.user?.full_name)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No doctors found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add Doctor Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={d.addDoctor} size="lg">
          <div className={styles.formGrid}>
            <div className={styles.formGroup}><Input label={t.auth.fullName} placeholder="Contoh: dr. Budi Santoso" value={newDoctor.full_name} onChange={e => setNewDoctor({...newDoctor, full_name: e.target.value})} /></div>
            <div className={styles.formGroup}><Input label={t.auth.email} placeholder="doctor@rsdigital.id" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} /></div>
            <div className={styles.formGroup}><Input label={t.auth.phone} placeholder="Contoh: 08123456789" value={newDoctor.phone_number} onChange={e => setNewDoctor({...newDoctor, phone_number: e.target.value})} /></div>
            <div className={styles.formGroup}><Input label="Password Login" type="password" placeholder="Minimal 8 karakter" value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})} /></div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.specialization}</label>
              <select value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}>
                <option value="Penyakit Dalam">Penyakit Dalam</option>
                <option value="Jantung & Pembuluh Darah">Jantung & Pembuluh Darah</option>
                <option value="Anak">Anak</option>
                <option value="Obstetri & Ginekologi">Obstetri & Ginekologi</option>
                <option value="Umum">Umum</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.branch}</label>
              <select value={newDoctor.hospital_branch} onChange={e => setNewDoctor({...newDoctor, hospital_branch: e.target.value})} style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}>
                <option value="RS Digital Jakarta Pusat">RS Digital Jakarta Pusat</option>
                <option value="RS Digital Jakarta Selatan">RS Digital Jakarta Selatan</option>
                <option value="RS Digital Tangerang">RS Digital Tangerang</option>
              </select>
            </div>
            <div className={styles.formGroup}><Input label="Biaya Konsultasi (Rp)" type="number" placeholder="Contoh: 150000" value={newDoctor.consultation_fee} onChange={e => setNewDoctor({...newDoctor, consultation_fee: e.target.value})} /></div>
            <div className={styles.formGroup}><Input label="Experience (years)" type="number" placeholder="Contoh: 10" value={newDoctor.experience_years} onChange={e => setNewDoctor({...newDoctor, experience_years: e.target.value})} /></div>
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" loading={savingEdit} onClick={handleCreateSubmit}>{t.common.save}</Button>
          </div>
        </Modal>

        {/* Edit Doctor Modal */}
        <Modal isOpen={!!editDoctor} onClose={() => setEditDoctor(null)} title="Edit Doctor Details" size="md">
          {editDoctor && (
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formFull}`}>
                <Input label="Biaya Konsultasi (Rp)" type="number" placeholder="Contoh: 150000" value={editFee} onChange={e => setEditFee(e.target.value)} />
              </div>
              <div className={`${styles.formGroup} ${styles.formFull}`}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.specialization}</label>
                <select value={editSpec} onChange={e => setEditSpec(e.target.value)} style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}>
                  <option value="Penyakit Dalam">Penyakit Dalam</option>
                  <option value="Jantung & Pembuluh Darah">Jantung & Pembuluh Darah</option>
                  <option value="Anak">Anak</option>
                  <option value="Obstetri & Ginekologi">Obstetri & Ginekologi</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.formFull}`}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{d.branch}</label>
                <select value={editBranch} onChange={e => setEditBranch(e.target.value)} style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}>
                  <option value="RS Digital Jakarta Pusat">RS Digital Jakarta Pusat</option>
                  <option value="RS Digital Jakarta Selatan">RS Digital Jakarta Selatan</option>
                  <option value="RS Digital Tangerang">RS Digital Tangerang</option>
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.formFull}`}>
                <Input label="Pengalaman (Tahun)" type="number" value={editExp} onChange={e => setEditExp(e.target.value)} />
              </div>
            </div>
          )}
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setEditDoctor(null)}>{t.common.cancel}</Button>
            <Button variant="primary" loading={savingEdit} onClick={handleEditSubmit}>{t.common.save}</Button>
          </div>
        </Modal>

        <ConfirmModal 
          isOpen={confirmState.isOpen}
          onClose={() => setConfirmState({...confirmState, isOpen: false})}
          onConfirm={executeToggle}
          loading={savingEdit}
          title="Konfirmasi Status Dokter"
          message={`Are you sure? Anda yakin ingin ${confirmState.status ? 'menonaktifkan' : 'mengaktifkan'} dokter ${confirmState.name}?`}
          confirmText={confirmState.status ? 'Nonaktifkan' : 'Aktifkan'}
          type={confirmState.status ? 'danger' : 'info'}
        />

      </div>
    </DashboardLayout>
  );
}
