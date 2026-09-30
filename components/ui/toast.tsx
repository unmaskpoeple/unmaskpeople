"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "error", title, message }),
    info: (title: string, message?: string) => addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl backdrop-blur-md border animate-slide-up transition-all ${
              t.type === "success"
                ? "bg-emerald-950/85 border-emerald-500/30 text-emerald-100"
                : t.type === "error"
                ? "bg-rose-950/85 border-rose-500/30 text-rose-100"
                : t.type === "warning"
                ? "bg-amber-950/85 border-amber-500/30 text-amber-100"
                : "bg-slate-900/85 border-slate-700/50 text-slate-100"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === "info" && <Info className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{t.title}</p>
              {t.message && <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
