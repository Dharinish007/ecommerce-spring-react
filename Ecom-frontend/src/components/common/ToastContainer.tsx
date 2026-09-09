import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast } from "@/store/slices/uiSlice";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latestToast = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      dispatch(removeToast(latestToast.id));
    }, latestToast.durationMs || 4000);

    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-cyan-600 shrink-0" />,
        };

        const borderMap = {
          success: "border-emerald-200 bg-emerald-50/95 text-emerald-950",
          error: "border-red-200 bg-red-50/95 text-red-950",
          warning: "border-amber-200 bg-amber-50/95 text-amber-950",
          info: "border-cyan-200 bg-cyan-50/95 text-cyan-950",
        };

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-300 ${borderMap[toast.type]}`}
          >
            {iconMap[toast.type]}
            <p className="text-sm font-medium leading-tight flex-1">{toast.message}</p>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
