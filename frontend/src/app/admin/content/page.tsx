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

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await api.delete(`/admin/articles/${id}`);
      mutateArticles();
    } catch (e) {
      alert('Failed to delete article');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo?')) return;
    try {
      await api.delete(`/admin/promos/${id}`);
      mutatePromos();
    } catch (e) {
      alert('Failed to delete promo');
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
                            <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} disabled />
                            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDeleteArticle(a.id)} />
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
                              <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} disabled />
                              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDeletePromo(p.id)} />
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

        {/* Form Modals (UI only for now) */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'articles' ? d.addArticle : d.addPromo} size="lg">
          <div className={styles.formGrid}>
            {tab === 'articles' ? (
              <>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Title" placeholder="Article title" /></div>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Category</label>
                  <select style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option>Kardiologi</option><option>Pediatri</option><option>Penyakit Dalam</option><option>Kesehatan Jiwa</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.formFull}`}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Content</label>
                  <textarea style={{ width: '100%', minHeight: 120, padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', resize: 'vertical' }} placeholder="Write article content..." />
                </div>
              </>
            ) : (
              <>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Title" placeholder="Promo title" /></div>
                <div className={styles.formGroup}><Input label="Discount (%)" type="number" placeholder="30" /></div>
                <div className={styles.formGroup}><Input label="Promo Code" placeholder="PROMO30" /></div>
                <div className={styles.formGroup}><Input label="Valid Until" type="date" /></div>
                <div className={`${styles.formGroup} ${styles.formFull}`}><Input label="Description" placeholder="Promo description..." /></div>
              </>
            )}
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={() => setShowModal(false)} disabled>{t.common.save}</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
