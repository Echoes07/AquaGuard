import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      className={cn('rounded-lg border border-slate-800 bg-slate-900/80 text-slate-100 shadow-sm', className)}
      ref={ref}
      {...props}
    />
  )
);

Card.displayName = 'Card';

export { Card };
