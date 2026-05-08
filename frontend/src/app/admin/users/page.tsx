'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { Search, Edit2, Trash2, Download, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import ConfirmModal from '@/components/ui/Modal/ConfirmModal';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminUsersPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data, mutate, isLoading } = useSWR(
    `/admin/users?search=${search}&role=${roleFilter === 'all' ? '' : roleFilter}`, 
    fetcher
  );
  const users = data?.data || [];
  
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, userId: string, status: boolean, name: string}>({
    isOpen: false,
    userId: '',
    status: false,
    name: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleStatus = async (userId: string, currentStatus: boolean, name: string) => {
    setConfirmState({ isOpen: true, userId, status: currentStatus, name });
  };

  const executeToggle = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/admin/users/${confirmState.userId}/toggle`);
      mutate();
      setConfirmState({ ...confirmState, isOpen: false });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.greeting}>{d.userManagement}</h1>
          <Button variant="outline" icon={<Download size={16} />}>{d.export}</Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ flex: 1 }}>
            <Input placeholder="Search users..." icon={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['all', 'patient', 'doctor', 'admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer', background: roleFilter === r ? 'var(--primary-500)' : 'var(--gray-100)', color: roleFilter === r ? 'white' : 'var(--text-secondary)', textTransform: 'capitalize', transition: 'all 0.2s' }}>{r}</button>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardBodyNoPad}>
            {isLoading ? (
               <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading users...</div>
            ) : (
              <table className={styles.table}>
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Phone</th><th>{d.status}</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><div className={styles.listAvatar} style={{ width: 32, height: 32, fontSize: 'var(--text-xs)' }}>{getInitials(u.full_name)}</div>{u.full_name}</div></td>
                      <td>{u.email || '-'}</td>
                      <td><span className={`${styles.badge} ${u.role === 'admin' ? styles.badgeDanger : u.role === 'doctor' ? styles.badgeInfo : styles.badgeSuccess}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{u.phone_number}</td>
                      <td><span className={`${styles.badge} ${u.is_active ? styles.badgeSuccess : styles.badgeDanger}`}>{u.is_active ? d.active : d.inactive}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button variant="ghost" size="sm" icon={u.is_active ? <ShieldAlert size={14} color="var(--danger-500)" /> : <ShieldCheck size={14} color="var(--success-500)" />} onClick={() => handleToggleStatus(u.id, u.is_active, u.full_name)} title={u.is_active ? 'Deactivate' : 'Activate'} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <ConfirmModal 
          isOpen={confirmState.isOpen}
          onClose={() => setConfirmState({...confirmState, isOpen: false})}
          onConfirm={executeToggle}
          loading={isUpdating}
          title="Konfirmasi Perubahan Status"
          message={`Are you sure? Anda yakin ingin ${confirmState.status ? 'menonaktifkan' : 'mengaktifkan'} akun ${confirmState.name}?`}
          confirmText={confirmState.status ? 'Nonaktifkan' : 'Aktifkan'}
          type={confirmState.status ? 'danger' : 'info'}
        />
      </div>
    </DashboardLayout>
  );
}
