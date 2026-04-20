"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TOAST_DISMISS_ARIA_LABEL } from "@/constants/toast.constants";
import type { ToastRecord } from "@/types/toast.types";
import { toastVariantIcons } from "./toast-icons";
import { toastVariantStyles } from "./toast-variant-styles";

export type ToastItemProps = {
  readonly toast: ToastRecord;
  readonly onDismiss: (toastId: string) => void;
};

const useToastAutoDismiss = (
  toastId: string,
  durationMs: number,
  onComplete: () => void,
  isPointerPaused: boolean,
): number => {
  const [progressPercent, setProgressPercent] = useState(100);
  const dismissAtRef = useRef<number>(0);
  const durationTotalRef = useRef<number>(durationMs);
  const pausedRemainingRef = useRef<number | null>(null);
  const wasPointerPausedRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<number | undefined>(undefined);
  const intervalIdRef = useRef<number | undefined>(undefined);
  const clearTimers = useCallback((): void => {
    if (timeoutIdRef.current !== undefined) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = undefined;
    }
    if (intervalIdRef.current !== undefined) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = undefined;
    }
  }, []);
  const syncProgress = useCallback((): void => {
    const denom = durationTotalRef.current;
    if (denom <= 0) {
      setProgressPercent(0);
      return;
    }
    const remaining = Math.max(0, dismissAtRef.current - Date.now());
    setProgressPercent((remaining / denom) * 100);
  }, []);
  const armTimers = useCallback((): void => {
    clearTimers();
    const delay = Math.max(0, dismissAtRef.current - Date.now());
    if (delay <= 0) {
      onComplete();
      return;
    }
    timeoutIdRef.current = window.setTimeout(onComplete, delay);
    intervalIdRef.current = window.setInterval(syncProgress, 32);
    syncProgress();
  }, [clearTimers, onComplete, syncProgress]);
  useEffect(() => {
    durationTotalRef.current = durationMs;
  }, [durationMs]);
  useEffect(() => {
    if (durationMs <= 0) {
      const timeoutId = window.setTimeout(() => {
        setProgressPercent(0);
      }, 0);
      return (): void => {
        window.clearTimeout(timeoutId);
      };
    }
    wasPointerPausedRef.current = false;
    pausedRemainingRef.current = null;
    dismissAtRef.current = Date.now() + durationMs;
    const startId = window.setTimeout(() => {
      setProgressPercent(100);
      armTimers();
    }, 0);
    return (): void => {
      window.clearTimeout(startId);
      clearTimers();
    };
  }, [toastId, durationMs, armTimers, clearTimers]);
  useEffect(() => {
    if (durationMs <= 0) {
      return undefined;
    }
    let deferId: number | undefined;
    if (isPointerPaused && !wasPointerPausedRef.current) {
      clearTimers();
      pausedRemainingRef.current = Math.max(
        0,
        dismissAtRef.current - Date.now(),
      );
      const frozenPercent =
        (pausedRemainingRef.current / durationTotalRef.current) * 100;
      deferId = window.setTimeout(() => {
        setProgressPercent(frozenPercent);
      }, 0);
    } else if (!isPointerPaused && wasPointerPausedRef.current) {
      const resumeMs = pausedRemainingRef.current ?? 0;
      pausedRemainingRef.current = null;
      dismissAtRef.current = Date.now() + resumeMs;
      deferId = window.setTimeout(() => {
        armTimers();
      }, 0);
    }
    wasPointerPausedRef.current = isPointerPaused;
    return (): void => {
      if (deferId !== undefined) {
        window.clearTimeout(deferId);
      }
    };
  }, [isPointerPaused, durationMs, armTimers, clearTimers]);
  return progressPercent;
};

export default function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isPointerPaused, setIsPointerPaused] = useState(false);
  const styles = toastVariantStyles[toast.variant];
  const durationMs = toast.durationMs;
  const handleDismiss = useCallback((): void => {
    onDismiss(toast.id);
  }, [onDismiss, toast.id]);
  const progressPercent = useToastAutoDismiss(
    toast.id,
    durationMs,
    handleDismiss,
    isPointerPaused,
  );
  const handlePointerEnter = useCallback((): void => {
    setIsPointerPaused(true);
  }, []);
  const handlePointerLeave = useCallback((): void => {
    setIsPointerPaused(false);
  }, []);
  const liveRole =
    toast.variant === "error" || toast.variant === "warning"
      ? "alert"
      : "status";
  const hasTitle = toast.title.trim().length > 0;
  return (
    <div
      role={liveRole}
      className={`relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg ${styles.container}`}
      onPointerEnter={durationMs > 0 ? handlePointerEnter : undefined}
      onPointerLeave={durationMs > 0 ? handlePointerLeave : undefined}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-gray-600 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label={TOAST_DISMISS_ARIA_LABEL}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <div className="flex gap-3 px-4 pb-3 pr-11 pt-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}
        >
          <span className={styles.iconGlyph}>
            {toastVariantIcons[toast.variant]}
          </span>
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          {hasTitle ? (
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {toast.title}
            </p>
          ) : null}
          <p
            className={`text-sm text-gray-700 dark:text-gray-200 ${hasTitle ? "mt-1" : ""}`}
          >
            {toast.message}
          </p>
        </div>
      </div>
      {durationMs > 0 ? (
        <div
          className="h-1 w-full bg-black/10 dark:bg-white/10"
          aria-hidden
        >
          <div
            className={`h-full ${styles.progressBar} motion-reduce:transition-none`}
            style={{
              width: `${progressPercent}%`,
              transition: isPointerPaused ? "none" : "width 50ms linear",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
