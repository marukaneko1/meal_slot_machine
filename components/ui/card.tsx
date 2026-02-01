'use client';

import { cn } from '@/lib/utils/cn';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
}

export function Card({ 
  children, 
  className, 
  interactive = false,
  as: Component = 'div' 
}: CardProps) {
  return (
    <Component
      className={cn(
        interactive ? 'card-interactive' : 'card',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({ 
  children, 
  className,
  as: Component = 'h3' 
}: CardTitleProps) {
  return (
    <Component className={cn('heading-4', className)}>
      {children}
    </Component>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('body-sm', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border-subtle', className)}>
      {children}
    </div>
  );
}
