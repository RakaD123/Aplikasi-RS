'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import styles from './Select.module.css';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, fullWidth = true, className, ...props }, ref) => {
    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={cn(styles.selectWrapper, error && styles.hasError)}>
          <select ref={ref} className={styles.select} {...props}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className={styles.chevron} size={18} />
        </div>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
