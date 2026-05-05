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
import { Phone, Lock, Heart, Shield } from 'lucide-react';

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempAuth, setTempAuth] = useState<{ user: any; token: string } | null>(null);

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      // 1. Verify credentials and get token
      const res = await api.post('/auth/login', {
        phone_number: formData.phone,
        password: formData.password,
      });
      setTempAuth({ user: res.data.user, token: res.data.access_token });

      // 2. Send OTP
      await api.post('/auth/otp/send', {
        phone_number: formData.phone,
        type: 'login',
      });

      setStep('otp');
    } catch (err: any) {
      setErrors({ phone: err.response?.data?.message || 'Login failed. Please check your credentials.' });
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
        type: 'login',
      });
      if (tempAuth) {
        setUser(tempAuth.user, tempAuth.token);
        router.push('/');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid OTP');
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
            {step === 'credentials' ? (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.loginTitle}</h1>
                  <p className={styles.authSubtitle}>{t.auth.loginSubtitle}</p>
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
                  <Input
                    label={t.auth.password}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                  />

                  <div className={styles.formOptions}>
                    <label className={styles.checkbox}>
                      <input type="checkbox" />
                      <span>{t.auth.rememberMe}</span>
                    </label>
                    <Link href="/forgot-password" className={styles.forgotLink}>
                      {t.auth.forgotPassword}
                    </Link>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    onClick={handleLogin}
                  >
                    {t.auth.loginButton}
                  </Button>
                </div>

                <p className={styles.authSwitch}>
                  {t.auth.noAccount}{' '}
                  <Link href="/register" className={styles.authSwitchLink}>
                    {t.auth.registerHere}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className={styles.authHeader}>
                  <h1 className={styles.authTitle}>{t.auth.otpTitle}</h1>
                  <p className={styles.authSubtitle}>{t.auth.otpSubtitle}</p>
                </div>

                <div className={styles.otpWrapper}>
                  <OTPInput onComplete={handleOTPComplete} />

                  <div className={styles.otpActions}>
                    <Button variant="ghost" size="sm" onClick={() => setStep('credentials')}>
                      {t.auth.back}
                    </Button>
                    <Button variant="ghost" size="sm">
                      {t.auth.otpResend}
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
