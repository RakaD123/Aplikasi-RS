'use client';

import { useRef, KeyboardEvent, ClipboardEvent, useState, useEffect } from 'react';
import styles from './OTPInput.module.css';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function OTPInput({ length = 6, onComplete, error, disabled }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const otp = newValues.join('');
    if (otp.length === length && !newValues.includes('')) {
      onComplete(otp);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newValues = [...values];
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i];
    }
    setValues(newValues);
    if (pasted.length === length) {
      onComplete(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div>
      <div className={styles.container}>
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`${styles.input} ${error ? styles.error : ''} ${value ? styles.filled : ''}`}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
