import React, { createContext, useContext } from 'react';
import { cn } from '../../utils/cn';

const TabsContext = createContext();

export function Tabs({ value, onValueChange, className, children }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-lg bg-slate-100 p-1 text-slate-500',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => context?.onValueChange && context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isActive
          ? 'bg-white text-indigo-700 shadow-sm font-semibold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div className={cn('mt-4 focus-visible:outline-none animate-in fade-in-50 duration-150', className)} {...props}>
      {children}
    </div>
  );
}
