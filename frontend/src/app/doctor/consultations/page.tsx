'use client';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import Button from '@/components/ui/Button/Button';
import { getInitials } from '@/lib/utils';
import { Send, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function DoctorConsultationsPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const d = t.dashboard;
  const [message, setMessage] = useState('');
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active consultations
  const { data: consultsData } = useSWR('/chat/consultations', fetcher, { refreshInterval: 5000 });
  const activeConsults = consultsData?.consultations || [];

  // Fetch messages for active consultation
  const { data: messagesData, mutate: mutateMessages } = useSWR(
    activeConsultation ? `/chat/${activeConsultation.consultation_id}/messages` : null,
    fetcher,
    { refreshInterval: 3000 }
  );
  const chatMessages = messagesData?.messages || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  return (
    <DashboardLayout role="doctor">
      <div className={styles.page}>
        <div className={styles.header}><h1 className={styles.greeting}>{d.consultations}</h1></div>

        <div className={styles.grid2}>
          {/* Patient List */}
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
                  <p style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Konsultasi akan muncul saat pasien melakukan booking.</p>
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
                    {chatMessages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                        Belum ada pesan. Mulai percakapan dengan pasien Anda!
                      </div>
                    )}
                    {chatMessages.map((msg: any) => (
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
      </div>
    </DashboardLayout>
  );
}
