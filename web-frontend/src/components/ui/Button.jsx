import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
        accent:
          'bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:bg-teal-800 focus-visible:ring-teal-500',
        outline:
          'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-indigo-500',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500',
        success:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2',
        lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
        icon: 'h-9 w-9 rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
