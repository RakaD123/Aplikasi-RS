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
import { Phone, Lock, Heart, Shield } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSendOTP = () => {
    if (!phone) { setErrors({ phone: 'Phone number is required' }); return; }
    setLoading(true);
    setTimeout(() => { setStep('otp'); setLoading(false); }, 1000);
  };

  const handleOTPComplete = () => setStep('reset');

  const handleReset = () => {
    const newErrors: Record<string, string> = {};
    if (!newPassword) newErrors.password = 'Password is required';
    if (newPassword !== confirmPassword) newErrors.confirm = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setTimeout(() => { router.push('/login'); }, 1500);
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
            {step === 'phone' && (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.forgotTitle}</h1>
                  <p className={styles.authSubtitle}>{t.auth.forgotSubtitle}</p>
                </div>
                <div className={styles.formFields}>
                  <Input
                    label={t.auth.phone}
                    placeholder="+62 812 3456 7890"
                    icon={<Phone size={18} />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                  />
                  <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSendOTP}>
                    {t.auth.next}
                  </Button>
                </div>
                <p className={styles.authSwitch}>
                  <Link href="/login" className={styles.authSwitchLink}>{t.auth.loginHere}</Link>
                </p>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.otpTitle}</h1>
                  <p className={styles.authSubtitle}>{t.auth.otpSubtitle}</p>
                </div>
                <div className={styles.otpWrapper}>
                  <OTPInput onComplete={handleOTPComplete} />
                  <div className={styles.otpActions}>
                    <Button variant="ghost" size="sm" onClick={() => setStep('phone')}>{t.auth.back}</Button>
                    <Button variant="ghost" size="sm">{t.auth.otpResend}</Button>
                  </div>
                </div>
              </>
            )}

            {step === 'reset' && (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.resetButton}</h1>
                  <p className={styles.authSubtitle}>Enter your new password below</p>
                </div>
                <div className={styles.formFields}>
                  <Input
                    label={t.auth.newPassword}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={errors.password}
                  />
                  <Input
                    label={t.auth.confirmPassword}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirm}
                  />
                  <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleReset}>
                    {t.auth.resetButton}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
