"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";
import ToastItem, {
  type ToastItem as ToastItemType,
  type ToastVariant,
} from "@/components/ui/toast/Toast";

interface ToastContextValue {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    custom: (message: string, variant: ToastVariant, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemType[]>([]);
  const idPrefix = useId();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant, duration = 4000) => {
      const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    [idPrefix],
  );

  const toast = useMemo(
    () => ({
      success: (message: string, duration?: number) =>
        addToast(message, "success", duration),
      error: (message: string, duration?: number) =>
        addToast(message, "error", duration),
      warning: (message: string, duration?: number) =>
        addToast(message, "warning", duration),
      info: (message: string, duration?: number) =>
        addToast(message, "info", duration),
      custom: (message: string, variant: ToastVariant, duration?: number) =>
        addToast(message, variant, duration),
    }),
    [addToast],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-[9999] flex flex-col gap-3"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx.toast;
}
