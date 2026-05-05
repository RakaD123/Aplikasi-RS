'use client';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import { Send, FileText, Stethoscope, MessageCircle, Star } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function ConsultationsPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const d = t.dashboard;
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('history');
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch completed bookings for history
  const { data: bookingsData } = useSWR('/patient/bookings', fetcher);
  const bookings = bookingsData?.data || [];
  const pastConsults = bookings.filter((b: any) => b.booking_status === 'completed');

  // Fetch active consultations for chat
  const { data: consultsData } = useSWR('/chat/consultations', fetcher, { refreshInterval: 5000 });
  const activeConsults = consultsData?.consultations || [];

  // Fetch messages for active consultation
  const { data: messagesData, mutate: mutateMessages } = useSWR(
    activeConsultation ? `/chat/${activeConsultation.consultation_id}/messages` : null,
    fetcher,
    { refreshInterval: 3000 }
  );
  const messages = messagesData?.messages || [];

  const [selectedNotes, setSelectedNotes] = useState<string | null>(null);

  // Rating state
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !activeConsultation || sending) return;
    setSending(true);
    try {
      await api.post(`/chat/${activeConsultation.consultation_id}/messages`, { message });
      setMessage('');
      mutateMessages();
    } catch (e) {
      alert('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingBooking || ratingValue === 0) return;
    setSubmittingRating(true);
    try {
      await api.post(`/patient/bookings/${ratingBooking.id}/review`, {
        rating: ratingValue,
        comment: ratingComment || undefined,
      });
      setRatedBookings(prev => new Set(prev).add(ratingBooking.id));
      setRatingBooking(null);
      setRatingValue(0);
      setRatingComment('');
      alert('Terima kasih atas rating Anda!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengirim rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.greeting}>{d.consultations}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[{ v: 'chat' as const, l: 'Chat' }, { v: 'history' as const, l: d.viewHistory }].map(tab => (
              <button key={tab.v} onClick={() => setActiveTab(tab.v)} style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === tab.v ? 'var(--primary-500)' : 'var(--gray-100)', color: activeTab === tab.v ? 'white' : 'var(--text-secondary)' }}>{tab.l}</button>
            ))}
          </div>
        </div>

        {activeTab === 'chat' && (
          <div className={styles.grid2}>
            {/* Consultation List */}
            <div className={styles.card}>
              <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Konsultasi Aktif</h3></div>
              <div className={styles.cardBodyNoPad}>
                {activeConsults.length > 0 ? activeConsults.map((c: any) => (
                  <div key={c.consultation_id} className={styles.listItem} style={{ cursor: 'pointer', background: activeConsultation?.consultation_id === c.consultation_id ? 'var(--primary-50)' : undefined }} onClick={() => setActiveConsultation(c)}>
                    <div className={styles.listAvatar}>{getInitials(c.other_name)}</div>
                    <div className={styles.listInfo}>
                      <div className={styles.listName}>{c.other_name}</div>
                      <div className={styles.listSub}>{c.last_message || c.complaint || 'Belum ada pesan'}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <MessageCircle size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
                    <p>Belum ada konsultasi aktif.</p>
                    <p style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Buat booking terlebih dahulu agar bisa chat dengan dokter.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className={styles.card}>
              {activeConsultation ? (
                <>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className={styles.listAvatar}>{getInitials(activeConsultation.other_name)}</div>
                      <div>
                        <div className={styles.listName}>{activeConsultation.other_name}</div>
                        <div className={styles.listSub}>● Online</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.chatContainer}>
                    <div className={styles.chatMessages}>
                      {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                          Belum ada pesan. Mulai percakapan dengan dokter Anda!
                        </div>
                      )}
                      {messages.map((msg: any) => (
                        <div key={msg.id} className={`${styles.chatBubble} ${msg.sender_id === user?.id ? styles.chatBubbleSent : styles.chatBubbleReceived}`}>
                          <p>{msg.message}</p>
                          <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: 4, display: 'block' }}>{msg.time}</span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className={styles.chatInput}>
                      <input className={styles.chatInputField} placeholder={d.typeMessage} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} />
                      <Button variant="primary" icon={<Send size={18} />} onClick={handleSend} loading={sending} />
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <MessageCircle size={48} />
                  <h3>Pilih konsultasi untuk mulai chat</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.viewHistory}</h3></div>
            <div className={styles.cardBodyNoPad}>
              {pastConsults.map((c: any) => (
                <div key={c.id} className={styles.listItem}>
                  <div className={styles.listAvatar}>{getInitials(c.doctor?.user?.full_name || '')}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>dr. {c.doctor?.user?.full_name}</div>
                    <div className={styles.listSub}>{new Date(c.appointment_time).toLocaleDateString()}</div>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeSuccess}`}>{d.completed}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="ghost" size="sm" icon={<FileText size={14} />} onClick={() => setSelectedNotes(c.consultation?.medical_notes || 'Belum ada catatan medis untuk sesi ini.')}>{d.medicalNotes}</Button>
                    {!ratedBookings.has(c.id) && (
                      <Button variant="outline" size="sm" icon={<Star size={14} />} onClick={() => { setRatingBooking(c); setRatingValue(0); setRatingComment(''); }}>Beri Rating</Button>
                    )}
                    {ratedBookings.has(c.id) && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} fill="#f59e0b" color="#f59e0b" /> Sudah dinilai</span>
                    )}
                  </div>
                </div>
              ))}
              {pastConsults.length === 0 && <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Belum ada riwayat konsultasi yang selesai.</div>}
            </div>
          </div>
        )}

        <Modal isOpen={!!selectedNotes} onClose={() => setSelectedNotes(null)} title="Catatan Medis Konsultasi">
          <div style={{ whiteSpace: 'pre-line', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {selectedNotes}
          </div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
             <Button variant="primary" onClick={() => setSelectedNotes(null)}>Tutup</Button>
          </div>
        </Modal>

        {/* Rating Modal */}
        <Modal isOpen={!!ratingBooking} onClose={() => setRatingBooking(null)} title="Beri Rating Dokter">
          {ratingBooking && (
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                Bagaimana pengalaman Anda dengan <strong>dr. {ratingBooking.doctor?.user?.full_name}</strong>?
              </p>
              {/* Star Selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.15s' , transform: (ratingHover === star || (!ratingHover && ratingValue === star)) ? 'scale(1.2)' : 'scale(1)' }}
                  >
                    <Star size={36} fill={(ratingHover || ratingValue) >= star ? '#f59e0b' : 'none'} color="#f59e0b" />
                  </button>
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-4)', color: ratingValue ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {ratingValue === 1 ? 'Kurang Baik' : ratingValue === 2 ? 'Cukup' : ratingValue === 3 ? 'Baik' : ratingValue === 4 ? 'Sangat Baik' : ratingValue === 5 ? 'Luar Biasa!' : 'Pilih rating'}
              </p>
              {/* Comment */}
              <textarea
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="Tulis komentar (opsional)..."
                style={{ width: '100%', minHeight: 80, padding: 'var(--space-3)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', resize: 'vertical', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <Button variant="ghost" onClick={() => setRatingBooking(null)}>Batal</Button>
                <Button variant="primary" disabled={ratingValue === 0} loading={submittingRating} onClick={handleSubmitRating}>Kirim Rating</Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}
