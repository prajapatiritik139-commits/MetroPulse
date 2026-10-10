import React from 'react';
import { useMetroStore } from '../../store/metroStore';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useMetroStore((state) => state.toasts);
  const dismissToast = useMetroStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Operator notifications"
    >
      {toasts.map((toast) => {
        const isCritical = toast.type === 'critical';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        const borderClass = isCritical
          ? 'border-red-500/50 bg-red-950/90 text-red-100 shadow-red-900/40'
          : isWarning
          ? 'border-amber-500/50 bg-amber-950/90 text-amber-100 shadow-amber-900/40'
          : isSuccess
          ? 'border-emerald-500/50 bg-slate-900/95 text-slate-100 shadow-emerald-950/40'
          : 'border-slate-700 bg-slate-900/95 text-slate-100';

        const Icon = isCritical
          ? AlertOctagon
          : isWarning
          ? AlertTriangle
          : isSuccess
          ? CheckCircle2
          : Info;

        const iconColor = isCritical
          ? 'text-red-400'
          : isWarning
          ? 'text-amber-400'
          : isSuccess
          ? 'text-emerald-400'
          : 'text-teal-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 ${borderClass} ${
              isCritical ? 'animate-pulse' : ''
            }`}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-tight">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
