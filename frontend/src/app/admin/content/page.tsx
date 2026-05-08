'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import { formatDate, getDaysLeft } from '@/lib/utils';
import { Plus, Edit2, Trash2, FileText, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import ConfirmModal from '@/components/ui/Modal/ConfirmModal';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminContentPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [tab, setTab] = useState<'articles' | 'promos'>('articles');
  const [showModal, setShowModal] = useState(false);

  // Fetch real data
  const { data: articlesData, mutate: mutateArticles, isLoading: loadingArticles } = useSWR('/admin/articles', fetcher);
  const { data: promosData, mutate: mutatePromos, isLoading: loadingPromos } = useSWR('/admin/promos', fetcher);

  const articles = articlesData?.data || [];
  const promos = promosData || [];

  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, title: string, type: 'article' | 'promo'}>({
    isOpen: false, id: '', title: '', type: 'article'
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit State
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kardiologi',
    content: '',
    code: '',
    discount_percentage: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Kardiologi',
      content: '',
      code: '',
      discount_percentage: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      description: ''
    });
    setEditItem(null);
  };

  const openEdit = (item: any, type: 'article' | 'promo') => {
    setTab(type === 'article' ? 'articles' : 'promos');
    setEditItem(item);
    if (type === 'article') {
      setFormData({ ...formData, title: item.title, category: item.category, content: item.content });
    } else {
      setFormData({ 
        ...formData, 
        title: item.title, 
        code: item.code, 
        discount_percentage: item.discount_percentage, 
        valid_from: item.valid_from, 
        valid_until: item.valid_until,
        description: item.description || ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'articles') {
        if (editItem) {
          await api.put(`/admin/articles/${editItem.id}`, formData);
        } else {
          await api.post('/admin/articles', formData);
        }
        mutateArticles();
      } else {
        if (editItem) {
          await api.put(`/admin/promos/${editItem.id}`, formData);
        } else {
          await api.post('/admin/promos', formData);
        }
        mutatePromos();
      }
      setShowModal(false);
      resetForm();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal menyimpan konten');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'article') {
        await api.delete(`/admin/articles/${deleteConfirm.id}`);
        mutateArticles();
      } else {
        await api.delete(`/admin/promos/${deleteConfirm.id}`);
        mutatePromos();
      }
      setDeleteConfirm({ ...deleteConfirm, isOpen: false });
    } catch (e) {
      alert('Gagal menghapus konten');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.greeting}>{d.contentManagement}</h1>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>{tab === 'articles' ? d.addArticle : d.addPromo}</Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {[{ v: 'articles' as const, l: t.articles.title, icon: <FileText size={16} /> }, { v: 'promos' as const, l: t.promos.title, icon: <Sparkles size={16} /> }].map(item => (
            <button key={item.v} onClick={() => setTab(item.v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === item.v ? 'var(--primary-500)' : 'var(--gray-100)', color: tab === item.v ? 'white' : 'var(--text-secondary)' }}>{item.icon} {item.l}</button>
          ))}
        </div>

        {tab === 'articles' && (
          <div className={styles.card}>
            <div className={styles.cardBodyNoPad}>
              {loadingArticles ? (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading articles...</div>
              ) : (
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Published</th><th>Actions</th></tr></thead>
                  <tbody>
                    {articles.map((a: any) => (
                      <tr key={a.id}>
                        <td style={{ maxWidth: 250 }}>{a.title}</td>
                        <td><span className={`${styles.badge} ${styles.badgeInfo}`}>{a.category}</span></td>
                        <td>{a.author?.full_name || 'System'}</td>
                        <td style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.published_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => openEdit(a, 'article')} />
                            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteConfirm({ isOpen: true, id: a.id, title: a.title, type: 'article' })} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {articles.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No articles found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'promos' && (
          <div className={styles.card}>
            <div className={styles.cardBodyNoPad}>
              {loadingPromos ? (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading promos...</div>
              ) : (
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Discount</th><th>Code</th><th>Valid Until</th><th>Days Left</th><th>Actions</th></tr></thead>
                  <tbody>
                    {promos.map((p: any) => {
                      const daysLeft = getDaysLeft(p.valid_until);
                      const isExpired = daysLeft <= 0;
                      return (
                        <tr key={p.id} style={{ opacity: isExpired ? 0.6 : 1 }}>
                          <td style={{ maxWidth: 250 }}>{p.title}</td>
                          <td style={{ fontWeight: 700 }}>{p.discount_percentage}%</td>
                          <td><span style={{ fontFamily: 'var(--font-mono)', padding: '2px 8px', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>{p.code}</span></td>
                          <td style={{ color: 'var(--text-tertiary)' }}>{formatDate(p.valid_until)}</td>
                          <td><span className={`${styles.badge} ${isExpired ? styles.badgeDanger : daysLeft <= 7 ? styles.badgeWarning : styles.badgeSuccess}`}>{isExpired ? 'Expired' : `${daysLeft} days`}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => openEdit(p, 'promo')} />
                              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteConfirm({ isOpen: true, id: p.id, title: p.title, type: 'promo' })} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {promos.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No promos found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Form Modals */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editItem ? 'Edit Konten' : (tab === 'articles' ? d.addArticle : d.addPromo)} size="lg">
          <div className={styles.formGrid}>
            {tab === 'articles' ? (
              <>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Title" placeholder="Article title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}>
                    <option value="Kardiologi">Kardiologi</option><option value="Pediatri">Pediatri</option><option value="Penyakit Dalam">Penyakit Dalam</option><option value="Kesehatan Jiwa">Kesehatan Jiwa</option><option value="Gizi">Gizi</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.formFull}`}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Content</label>
                  <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{ width: '100%', minHeight: 180, padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', resize: 'vertical' }} placeholder="Write article content..." />
                </div>
              </>
            ) : (
              <>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Title" placeholder="Promo title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div className={styles.formGroup}><Input label="Discount (%)" type="number" placeholder="30" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: e.target.value})} /></div>
                <div className={styles.formGroup}><Input label="Promo Code" placeholder="PROMO30" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                <div className={styles.formGroup}><Input label="Valid Until" type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} /></div>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Description" placeholder="Promo description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              </>
            )}
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{t.common.save}</Button>
          </div>
        </Modal>

        <ConfirmModal 
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({...deleteConfirm, isOpen: false})}
          onConfirm={executeDelete}
          loading={isDeleting}
          title={`Hapus ${deleteConfirm.type === 'article' ? 'Artikel' : 'Promo'}`}
          message={`Are you sure? Anda yakin ingin menghapus "${deleteConfirm.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Ya, Hapus"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}
