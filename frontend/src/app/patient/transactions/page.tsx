'use client';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileText, X, CreditCard, Building, Wallet, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useState } from 'react';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function TransactionsPage() {
  const { t } = useI18n();
  const d = t.dashboard;

  // Real-time polling every 5 seconds
  const { data, mutate } = useSWR('/patient/bookings', fetcher, { refreshInterval: 5000 });
  const bookings = data?.data || [];

  const [loadingPay, setLoadingPay] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Derive transaction data from bookings
  const transactions = bookings.map((b: any, i: number) => ({
    id: b.booking_code || `TX${String(i + 1).padStart(3, '0')}`,
    bookingId: b.id,
    desc: `Konsultasi dr. ${b.doctor?.user?.full_name || 'Dokter'}${b.doctor?.specialization ? ', ' + b.doctor.specialization : ''}`,
    amount: parseFloat(b.amount) || 0,
    date: b.paid_at || b.created_at,
    paymentStatus: b.payment_status,
    bookingStatus: b.booking_status,
  }));

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan booking ini?')) return;
    try {
      await api.delete(`/patient/bookings/${bookingId}`);
      mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membatalkan booking');
    }
  };

  const handlePay = async (booking: any) => {
    setLoadingPay(true);
    setSelectedBooking(booking);
    try {
      const res = await api.post(`/patient/bookings/${booking.bookingId}/pay`);
      const snapToken = res.data.snap_token;
      
      if (snapToken && (window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: async function (result: any) {
            await api.get(`/patient/bookings/${booking.bookingId}/check-status`);
            alert('Pembayaran berhasil!');
            mutate();
          },
          onPending: async function (result: any) {
            await api.get(`/patient/bookings/${booking.bookingId}/check-status`);
            alert('Menunggu penyelesaian pembayaran!');
            mutate();
          },
          onError: function (result: any) {
            alert('Pembayaran gagal!');
            mutate();
          },
          onClose: function () {
            // Optional: User closed the popup before completing payment
          }
        });
      } else {
        alert('Gagal memuat Midtrans Snap UI.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message + (err.response?.data?.error ? '\n' + err.response?.data?.error : ''));
    } finally {
      setLoadingPay(false);
      setSelectedBooking(null);
    }
  };

  const totalSpent = transactions.filter((tx: any) => tx.paymentStatus === 'paid').reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const paidCount = transactions.filter((tx: any) => tx.paymentStatus === 'paid').length;
  const pendingCount = transactions.filter((tx: any) => tx.paymentStatus === 'unpaid').length;
  const refundedCount = transactions.filter((tx: any) => tx.paymentStatus === 'refunded').length;

  const statusBadge = (status: string) => {
    const cls = status === 'paid' ? styles.badgeSuccess : status === 'unpaid' ? styles.badgeWarning : status === 'failed' ? styles.badgeDanger : styles.badgeInfo;
    const label = status === 'paid' ? d.paid : status === 'unpaid' ? d.pending : status === 'failed' ? d.failed : d.refunded;
    return <span className={`${styles.badge} ${cls}`}>{label}</span>;
  };

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>{d.transactionHistory}</h1>
        </div>

        <div className={styles.statsGrid}>
          {[
            { label: 'Total Spent', value: formatCurrency(totalSpent), bg: '#3b5cf815', color: '#3b5cf8' },
            { label: d.paid, value: paidCount.toString(), bg: '#22c55e15', color: '#22c55e' },
            { label: d.pending, value: pendingCount.toString(), bg: '#f59e0b15', color: '#f59e0b' },
            { label: d.refunded, value: refundedCount.toString(), bg: '#8b5cf615', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: s.bg, color: s.color }}><FileText size={24} /></div>
              <div className={styles.statInfo}><span className={styles.statValue}>{s.value}</span><span className={styles.statLabel}>{s.label}</span></div>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.transactionHistory}</h3></div>
          <div className={styles.cardBodyNoPad}>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Description</th><th>{d.amount}</th><th>{d.date}</th><th>{d.status}</th><th></th></tr></thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{tx.id}</td>
                    <td>{tx.desc}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{tx.date ? formatDate(tx.date) : '-'}</td>
                    <td>{statusBadge(tx.paymentStatus)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {tx.paymentStatus === 'unpaid' && tx.bookingStatus !== 'cancelled' && (
                          <>
                            <Button variant="primary" size="sm" icon={<CreditCard size={14} />} onClick={() => handlePay(tx)} loading={loadingPay && selectedBooking?.id === tx.id}>Bayar</Button>
                            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => handleCancel(tx.bookingId)} style={{ color: 'var(--danger-500)' }}>Batalkan</Button>
                          </>
                        )}
                        {tx.paymentStatus === 'paid' && (
                          <Button variant="ghost" size="sm" icon={<Download size={14} />}>{d.invoiceDownload}</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--text-tertiary)' }}>Belum ada transaksi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
