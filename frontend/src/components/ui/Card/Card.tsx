'use client';

import { ReactNode } from 'react';
import styles from './Card.module.css';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        styles[variant],
        styles[`p-${padding}`],
        hover && styles.hover,
        onClick && styles.clickable,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.header, className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.body, className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.footer, className)}>{children}</div>;
}
