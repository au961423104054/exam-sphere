import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';
