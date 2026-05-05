'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import Navbar from '@/components/layout/Navbar/Navbar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import OTPInput from '@/components/ui/OTPInput/OTPInput';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import { api } from '@/lib/api';
import { Phone, Lock, User, Mail, Heart, Shield } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP, 3: profile
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    otp: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSendOTP = async () => {
    if (!formData.phone) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await api.post('/auth/otp/send', {
        phone_number: formData.phone,
        type: 'register',
      });
      setStep(2);
    } catch (err: any) {
      setErrors({ phone: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    try {
      await api.post('/auth/otp/verify', {
        phone_number: formData.phone,
        otp,
        type: 'register',
      });
      setFormData({ ...formData, otp });
      setStep(3);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name) newErrors.full_name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await api.post('/auth/register', {
        phone_number: formData.phone,
        otp: formData.otp,
        full_name: formData.full_name,
        email: formData.email || undefined,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        gender: formData.gender || undefined,
      });

      alert('Registrasi berhasil! Silakan login dengan nomor telepon Anda.');
      router.push('/login');
    } catch (err: any) {
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors;
        if (serverErrors) {
          // Flatten Laravel validation errors (arrays to first string)
          const flat: Record<string, string> = {};
          Object.keys(serverErrors).forEach(key => {
            flat[key] = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
          });
          setErrors(flat);
        } else {
          alert(err.response.data.message || 'Registrasi gagal. Coba lagi.');
        }
      } else {
        alert(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.authPage}>
        <div className={styles.authLeft}>
          <div className={styles.authLeftContent}>
            <Heart size={48} className={styles.authIcon} />
            <h2 className={styles.authLeftTitle}>RS Digital Portal</h2>
            <p className={styles.authLeftDesc}>{t.hero.subtitle}</p>
            <div className={styles.authFeatures}>
              <div className={styles.authFeature}>
                <Shield size={20} />
                <span>Verified OTP Authentication</span>
              </div>
              <div className={styles.authFeature}>
                <Lock size={20} />
                <span>End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.authRight}>
          <div className={styles.authForm}>
            {/* Step Indicator */}
            <div className={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepActive : ''}`}>
                  {s}
                </div>
              ))}
            </div>

            {step === 1 && (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.registerTitle}</h1>
                  <p className={styles.authSubtitle}>
                    {t.auth.step} 1 {t.auth.of} 3 — {t.auth.phone}
                  </p>
                </div>
                <div className={styles.formFields}>
                  <Input
                    label={t.auth.phone}
                    placeholder="+62 812 3456 7890"
                    icon={<Phone size={18} />}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                  />
                  <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSendOTP}>
                    {t.auth.next}
                  </Button>
                </div>
                <p className={styles.authSwitch}>
                  {t.auth.hasAccount}{' '}
                  <Link href="/login" className={styles.authSwitchLink}>{t.auth.loginHere}</Link>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.otpTitle}</h1>
                  <p className={styles.authSubtitle}>
                    {t.auth.step} 2 {t.auth.of} 3 — {t.auth.otpSubtitle}
                  </p>
                </div>
                <div className={styles.otpWrapper}>
                  <OTPInput onComplete={handleOTPComplete} />
                  <div className={styles.otpActions}>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>{t.auth.back}</Button>
                    <Button variant="ghost" size="sm">{t.auth.otpResend}</Button>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.registerTitle}</h1>
                  <p className={styles.authSubtitle}>
                    {t.auth.step} 3 {t.auth.of} 3 — Complete your profile
                  </p>
                </div>
                <div className={styles.formFields}>
                  <Input
                    label={t.auth.fullName}
                    placeholder="John Doe"
                    icon={<User size={18} />}
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    error={errors.full_name}
                  />
                  <Input
                    label={t.auth.email}
                    type="email"
                    placeholder="john@example.com"
                    icon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                  />
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Jenis Kelamin</label>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      {[{ value: 'male', label: 'Laki-laki' }, { value: 'female', label: 'Perempuan' }].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: opt.value })}
                          style={{
                            flex: 1,
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: formData.gender === opt.value ? '2px solid var(--primary-500)' : '2px solid var(--border-light)',
                            background: formData.gender === opt.value ? 'var(--primary-50)' : 'var(--bg-primary)',
                            color: formData.gender === opt.value ? 'var(--primary-600)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: 'var(--text-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    label={t.auth.password}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                  />
                  <Input
                    label={t.auth.confirmPassword}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                  />
                  <div className={styles.formButtonGroup}>
                    <Button variant="ghost" size="lg" onClick={() => setStep(2)}>{t.auth.back}</Button>
                    <Button variant="primary" size="lg" loading={loading} onClick={handleRegister} style={{ flex: 1 }}>
                      {t.auth.registerButton}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
