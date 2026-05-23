import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-cyan-500/15 text-cyan-300',
      secondary: 'bg-slate-800 text-slate-200',
      destructive: 'bg-red-500/15 text-red-300',
      success: 'bg-emerald-500/15 text-emerald-300',
      warning: 'bg-amber-500/15 text-amber-300',
    };

    return (
      <div
        className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
