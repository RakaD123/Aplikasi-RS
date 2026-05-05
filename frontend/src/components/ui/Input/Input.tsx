'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import styles from './Input.module.css';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, fullWidth = true, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={cn(styles.inputWrapper, error && styles.hasError)}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(styles.input, icon && styles.hasIcon)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className={styles.error}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
