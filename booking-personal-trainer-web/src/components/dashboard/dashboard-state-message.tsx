"use client";

import type React from "react";

export type DashboardStateMessageProps = {
  readonly variant: "loading" | "error" | "empty";
  readonly message?: string;
};

export const DashboardStateMessage = (props: DashboardStateMessageProps): React.ReactNode => {
  const { variant, message } = props;
  const text =
    message ??
    (variant === "loading"
      ? "Loading…"
      : variant === "error"
        ? "Something went wrong."
        : "No data yet.");
  const styles =
    variant === "error"
      ? "border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200"
      : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-6 text-center text-sm ${styles}`}
    >
      {text}
    </div>
  );
};
