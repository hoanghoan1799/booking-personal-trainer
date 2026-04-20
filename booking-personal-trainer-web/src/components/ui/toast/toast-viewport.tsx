"use client";

import { TOAST_REGION_ARIA_LABEL } from "@/constants/toast.constants";
import type { ToastRecord } from "@/types/toast.types";
import ToastItem from "./toast-item";

export type ToastViewportProps = {
  readonly toasts: readonly ToastRecord[];
  readonly onDismiss: (toastId: string) => void;
};

export default function ToastViewport({
  toasts,
  onDismiss,
}: ToastViewportProps) {
  return (
    <div
      className="fixed right-4 top-[calc(var(--app-header-height,72px)+1rem)] z-[100000] flex w-[min(100vw-2rem,24rem)] flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label={TOAST_REGION_ARIA_LABEL}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
