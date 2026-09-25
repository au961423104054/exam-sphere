import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white text-slate-900 shadow-card transition-all duration-150',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6 border-b border-slate-100', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'font-heading font-semibold text-lg sm:text-xl text-slate-900 tracking-tight',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-slate-500 leading-relaxed', className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0 border-t border-slate-100 mt-4', className)}
      {...props}
    />
  );
}
