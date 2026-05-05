'use client';

import { ReactNode } from 'react';
import styles from './Badge.module.css';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], styles[size], className)}>
      {children}
    </span>
  );
}
