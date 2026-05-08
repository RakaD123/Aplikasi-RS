'use client';
import Modal from './Modal';
import Button from '../Button/Button';
import styles from './Modal.module.css';
import { ShieldAlert } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger',
  loading = false
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
        <div style={{ 
          width: 60, 
          height: 60, 
          borderRadius: '50%', 
          background: type === 'danger' ? '#ef444415' : '#3b5cf815', 
          color: type === 'danger' ? '#ef4444' : '#3b5cf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)'
        }}>
          <ShieldAlert size={32} />
        </div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{title}</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-6)' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }} disabled={loading}>{cancelText}</Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            style={{ flex: 1 }}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
