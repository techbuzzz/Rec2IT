import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accent?: string;
}

export const Card = ({ className, children, accent, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-bg-card/80 backdrop-blur p-5 transition-all',
        'hover:border-white/20 hover:bg-bg-card',
        className,
      )}
      style={accent ? { boxShadow: `0 0 30px ${accent}30` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};