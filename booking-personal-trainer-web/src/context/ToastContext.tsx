"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import ToastViewport from "@/components/ui/toast/toast-viewport";
import {
  TOAST_DEFAULT_DURATION_MS,
  TOAST_DEDUPE_WINDOW_MS,
} from "@/constants/toast.constants";
import { normalizeToastMessageInput } from "@/lib/toast/normalize-toast-input";
import type {
  ShowToastInput,
  ToastActions,
  ToastContextValue,
  ToastMessageInput,
  ToastRecord,
  ToastVariant,
} from "@/types/toast.types";

const ToastContext = createContext<ToastContextValue | null>(null);

const buildToastDedupeKey = (input: {
  readonly variant: ToastVariant;
  readonly title: string;
  readonly message: string;
}): string =>
  `${input.variant}\u0000${input.title}\u0000${input.message}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idPrefix = useId();
  const dedupeTimestampsRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const showToast = useCallback(
    (input: ShowToastInput) => {
      const durationMs = input.durationMs ?? TOAST_DEFAULT_DURATION_MS;
      const dedupeKey = buildToastDedupeKey({
        variant: input.variant,
        title: input.title,
        message: input.message,
      });
      const now = Date.now();
      const lastAt = dedupeTimestampsRef.current.get(dedupeKey) ?? 0;
      if (now - lastAt < TOAST_DEDUPE_WINDOW_MS) {
        return;
      }
      dedupeTimestampsRef.current.set(dedupeKey, now);
      const id = `${idPrefix}-${now}-${Math.random().toString(36).slice(2)}`;
      const next: ToastRecord = {
        id,
        variant: input.variant,
        title: input.title,
        message: input.message,
        durationMs,
      };
      setToasts((prev) => [...prev, next]);
    },
    [idPrefix],
  );

  const toastActions = useMemo<ToastActions>(
    () => ({
      show: showToast,
      success: (input: ToastMessageInput, durationMs?: number) => {
        const content = normalizeToastMessageInput(input);
        showToast({ ...content, variant: "success", durationMs });
      },
      error: (input: ToastMessageInput, durationMs?: number) => {
        const content = normalizeToastMessageInput(input);
        showToast({ ...content, variant: "error", durationMs });
      },
      warning: (input: ToastMessageInput, durationMs?: number) => {
        const content = normalizeToastMessageInput(input);
        showToast({ ...content, variant: "warning", durationMs });
      },
      info: (input: ToastMessageInput, durationMs?: number) => {
        const content = normalizeToastMessageInput(input);
        showToast({ ...content, variant: "info", durationMs });
      },
      dismiss: dismissToast,
    }),
    [dismissToast, showToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toast: toastActions }),
    [toastActions],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastActions {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx.toast;
}
