'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import { mockDoctors } from '@/lib/data/mock-data';
import { getInitials, formatCurrency } from '@/lib/utils';
import { Search, Star, Clock, MapPin, CreditCard, Wallet, Building, CheckCircle, Download, ArrowRight, Eye, Users, Award, Calendar as CalendarIcon, Stethoscope } from 'lucide-react';
import useSWR from 'swr';
import Script from 'next/script';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function BookingPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [profileDoctorId, setProfileDoctorId] = useState<string | null>(null);

  const { data: doctorsData } = useSWR('/public/doctors', fetcher);
  const doctors = doctorsData?.data || [];

  // Fetch detailed profile when modal is open
  const { data: profileData } = useSWR(
    profileDoctorId ? `/public/doctors/${profileDoctorId}` : null,
    fetcher
  );
  const profileDoctor = profileData?.doctor;

  const doctor = doctors.find((doc: any) => doc.id === selectedDoctor);
  const selectedSlotData = doctor?.available_slots?.find((s: any) => s.id === selectedSlot);

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      // 1. Calculate a date for the appointment
      const appointmentTime = new Date();
      if (selectedSlotData) {
        const [hours, minutes] = selectedSlotData.start_time.split(':');
        appointmentTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      }

      // 2. Create the booking
      const bookRes = await api.post('/patient/bookings', {
        doctor_id: doctor.id,
        schedule_id: selectedSlotData?.id,
        appointment_time: appointmentTime.toISOString(),
        complaint: 'Routine checkup',
      });
      const bookingId = bookRes.data.booking.id;

      // 3. Process payment (simulated)
      let method = 'virtual_account';
      if (paymentMethod === 'ewallet') method = 'ewallet';
      if (paymentMethod === 'cc') method = 'credit_card';

      const payRes = await api.post(`/patient/bookings/${bookingId}/pay`, {
        payment_method: method
      });

      setBookingResult(payRes.data.booking);
      setStep(4);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>{d.myBookings}</h1>
        </div>

        {/* Steps */}
        <div className={styles.steps}>
          {[d.selectDoctor, d.selectSlot, d.payment, d.confirmation].map((label, i) => (
            <div key={i} className={styles.step}>
              {i > 0 && <div className={styles.stepLine} style={{ background: step > i ? 'var(--accent-500)' : undefined }} />}
              <div className={`${styles.step} ${step === i + 1 ? styles.stepActive : ''} ${step > i + 1 ? styles.stepCompleted : ''}`}>
                <div className={styles.stepDot}>{step > i + 1 ? '✓' : i + 1}</div>
                <span className={styles.stepLabel}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{d.selectDoctor}</h3>
              <div style={{ maxWidth: 300 }}>
                <Input placeholder={t.doctorSearch.searchPlaceholder} icon={<Search size={16} />} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className={styles.cardBodyNoPad}>
              {doctors.filter((doc: any) => doc.name.toLowerCase().includes(searchQuery.toLowerCase())).map((doc: any) => (
                <div key={doc.id} className={styles.listItem} style={{ cursor: 'pointer', background: selectedDoctor === doc.id ? 'var(--primary-50)' : undefined }} onClick={() => setSelectedDoctor(doc.id)}>
                  <div className={styles.listAvatar}>{getInitials(doc.name)}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{doc.name}</div>
                    <div className={styles.listSub}>{doc.specialization} · {doc.hospital_branch}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" /> {doc.rating}
                    </div>
                    <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setProfileDoctorId(doc.id); }}>Profil</Button>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading doctors...</div>}
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" disabled={!selectedDoctor} onClick={() => setStep(2)} icon={<ArrowRight size={16} />} iconPosition="right">{t.auth.next}</Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Slot */}
        {step === 2 && doctor && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{d.selectSlot}</h3>
            </div>
            <div className={styles.cardBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <div className={styles.listAvatar}>{getInitials(doctor.name)}</div>
                <div><div className={styles.listName}>{doctor.name}</div><div className={styles.listSub}>{doctor.specialization}</div></div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>{t.doctorSearch.availableSlots}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                {doctor.available_slots?.filter((s: any) => s.is_active).map((slot: any) => (
                  <button key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                    style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: selectedSlot === slot.id ? '2px solid var(--primary-500)' : '1px solid var(--border-light)', background: selectedSlot === slot.id ? 'var(--primary-50)' : 'var(--bg-primary)', cursor: 'pointer', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600, color: selectedSlot === slot.id ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>{slot.day_of_week}</div>
                    {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => setStep(1)}>{t.auth.back}</Button>
              <Button variant="primary" disabled={!selectedSlot} onClick={() => setStep(3)} icon={<ArrowRight size={16} />} iconPosition="right">{t.auth.next}</Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.payment}</h3></div>
            <div className={styles.cardBody}>
              <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{d.amount}</span>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary-600)' }}>{doctor ? formatCurrency(doctor.consultation_fee || 0) : 'Rp 0'}</span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>{d.paymentMethod}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { id: 'va', icon: <Building size={20} />, label: d.virtualAccount, desc: 'BCA, BNI, BRI, Mandiri' },
                  { id: 'ewallet', icon: <Wallet size={20} />, label: d.eWallet, desc: 'GoPay, OVO, DANA, ShopeePay' },
                  { id: 'cc', icon: <CreditCard size={20} />, label: d.creditCard, desc: 'Visa, Mastercard' },
                ].map(method => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: paymentMethod === method.id ? '2px solid var(--primary-500)' : '1px solid var(--border-light)', background: paymentMethod === method.id ? 'var(--primary-50)' : 'var(--bg-primary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <div style={{ color: paymentMethod === method.id ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>{method.icon}</div>
                    <div><div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{method.label}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{method.desc}</div></div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => setStep(2)}>{t.auth.back}</Button>
              <Button variant="accent" disabled={!paymentMethod} loading={loading} onClick={handleCreateBooking}>{d.payNow}</Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className={styles.card}>
            <div className={styles.cardBody} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
              <CheckCircle size={64} color="var(--success-500)" style={{ margin: '0 auto var(--space-4)' }} />
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)' }}>{d.bookingSuccess}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{d.bookingId}: {bookingResult?.booking_code}</p>
              <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', maxWidth: 400, margin: '0 auto var(--space-6)', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><span style={{ color: 'var(--text-tertiary)' }}>Doctor</span><span style={{ fontWeight: 600 }}>{doctor?.name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><span style={{ color: 'var(--text-tertiary)' }}>Date</span><span style={{ fontWeight: 600 }}>Tomorrow</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><span style={{ color: 'var(--text-tertiary)' }}>Time</span><span style={{ fontWeight: 600 }}>{selectedSlotData?.start_time.substring(0, 5)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}><span style={{ color: 'var(--text-tertiary)' }}>{d.amount}</span><span style={{ fontWeight: 600 }}>{formatCurrency(350000)}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <Button variant="outline" icon={<Download size={16} />}>{d.downloadTicket}</Button>
                <Button variant="primary" onClick={() => setStep(1)}>{d.bookDoctor}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Profile Modal */}
        <Modal isOpen={!!profileDoctorId} onClose={() => setProfileDoctorId(null)} title="Profil Dokter">
          {profileDoctor ? (
            <div>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                <div className={styles.listAvatar} style={{ width: 72, height: 72, margin: '0 auto var(--space-3)', fontSize: 'var(--text-xl)' }}>{getInitials(profileDoctor.name)}</div>
                <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{profileDoctor.name}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{profileDoctor.specialization}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{profileDoctor.hospital_branch}</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                {[
                  { icon: <Star size={18} />, value: profileDoctor.rating, label: `Rating (${profileDoctor.review_count || 0})`, color: '#f59e0b' },
                  { icon: <Users size={18} />, value: profileDoctor.total_patients, label: 'Pasien', color: '#3b5cf8' },
                  { icon: <Award size={18} />, value: `${profileDoctor.experience_years} thn`, label: 'Pengalaman', color: '#07c4af' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{s.value}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Fee */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Biaya Konsultasi</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{formatCurrency(parseInt(profileDoctor.consultation_fee || '0'))}</span>
              </div>

              {/* Reviews */}
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Ulasan Pasien</h4>
                {profileDoctor.reviews && profileDoctor.reviews.length > 0 ? (
                  profileDoctor.reviews.map((r: any) => (
                    <div key={r.id} style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{r.patient_name}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= r.rating ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{r.comment}</p>}
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{r.date}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Belum ada ulasan.</p>
                )}
              </div>

              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => { setSelectedDoctor(profileDoctorId); setProfileDoctorId(null); }}>Pilih Dokter Ini</Button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>Memuat profil...</div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}
