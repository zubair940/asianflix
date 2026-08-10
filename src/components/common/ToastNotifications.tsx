import React from 'react';
import { useToast } from '../../context/ToastContext.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotifications: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 border-slate-700 text-white';
        let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-slate-900 border-emerald-500/40 text-emerald-100 shadow-emerald-500/10';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-slate-900 border-rose-500/40 text-rose-100 shadow-rose-500/10';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${bg} shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <p className="text-xs font-medium leading-tight truncate">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
