import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95',
  ghost:
    'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg font-bold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';