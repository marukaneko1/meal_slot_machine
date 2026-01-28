'use client';

import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  gold: 'btn-gold',
  ghost: 'px-4 py-2 rounded-lg text-gray-400 hover:text-slot-gold hover:bg-slot-gold/10 transition-colors',
  danger: 'px-6 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 transition-all duration-300 active:scale-95',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: '',
  lg: 'px-8 py-4 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          variantStyles[variant],
          size !== 'md' && sizeStyles[size],
          'inline-flex items-center justify-center gap-2',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
