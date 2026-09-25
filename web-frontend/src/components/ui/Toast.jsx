import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Toast({ toast, onDismiss }) {
  const { id, type = 'info', title, message, duration = 4500 } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);
      if (remainingPct <= 0) {
        clearInterval(interval);
        onDismiss(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [id, duration, onDismiss]);

  const typeConfig = {
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      bar: 'bg-amber-500',
    },
    destructive: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      bar: 'bg-rose-500',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      bar: 'bg-emerald-500',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      icon: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
      bar: 'bg-indigo-600',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={cn(
        'relative overflow-hidden w-80 sm:w-96 rounded-xl border p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200',
        config.bg
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          {config.icon}
          <div>
            <h4 className="font-heading font-bold text-sm leading-tight">{title}</h4>
            {message && <p className="text-xs mt-1 opacity-90 leading-relaxed font-sans">{message}</p>}
          </div>
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div
          className={cn('h-full transition-all duration-75', config.bar)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 pointer-events-auto">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
