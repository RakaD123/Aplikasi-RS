import styles from './Skeleton.module.css';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export default function Skeleton({ width, height = '20px', borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius }}
    />
  );
}
