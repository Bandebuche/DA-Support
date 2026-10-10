import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  toast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(({ title, description, type = 'success' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-5 sm:bottom-5 z-50 flex flex-col gap-2 pointer-events-none sm:max-w-sm w-auto sm:w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto p-3.5 rounded-2xl border flex items-start gap-3 shadow-lg transition-all duration-200',
              'bg-surface border-surface-border text-xs',
              t.type === 'success' && 'border-emerald-300 dark:border-emerald-800',
              t.type === 'error' && 'border-red-300 dark:border-red-800',
              'animate-in fade-in slide-in-from-bottom-3'
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-text-pure">{t.title}</h5>
              {t.description && (
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-muted hover:text-text-pure transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
