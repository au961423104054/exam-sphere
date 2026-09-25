import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        secondary: 'bg-slate-100 text-slate-700 border-slate-200',
        accent: 'bg-teal-50 text-teal-700 border-teal-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        destructive: 'bg-rose-50 text-rose-700 border-rose-200',
        outline: 'text-slate-700 border-slate-300 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
