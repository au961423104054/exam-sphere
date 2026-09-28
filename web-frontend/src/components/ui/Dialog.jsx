import React from 'react';
import { cn } from '../../utils/cn';

export function Dialog({ open, onOpenChange, className, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {/* Modal Dialog Content Container */}
      <div className={cn("relative z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150", className)}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <h3
      className={cn('font-heading text-lg font-bold text-slate-900', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-slate-600 leading-relaxed', className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-slate-100',
        className
      )}
      {...props}
    />
  );
}
