'use client';

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

export default function Toast({ toast, onRemove }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div className={cn(styles.toast, styles[toast.type], isExiting && styles.exiting)}>
      <span className={styles.icon}>{icons[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.close} onClick={() => { setIsExiting(true); setTimeout(() => onRemove(toast.id), 300); }}>
        <X size={16} />
      </button>
    </div>
  );
}
