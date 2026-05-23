import React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <hr
        className={cn(
          'bg-slate-800',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator };
