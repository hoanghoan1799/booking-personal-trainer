"use client";

import type { ReactElement } from "react";
import Badge from "@/components/ui/badge/Badge";

const PAYMENT_REQUIRED_BG = "#e85d56" as const;

const LockGlyph = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6v-9z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckGlyph = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12l4 4L19 7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type TraineeWorkoutPaymentListBadgeProps = {
  readonly isPaid: boolean;
};

/**
 * Badge used on workout list rows/cards when the trainee is the payer —
 * replaces training status until the user opens details.
 */
export const TraineeWorkoutPaymentListBadge = (
  props: TraineeWorkoutPaymentListBadgeProps,
): ReactElement => {
  if (props.isPaid) {
    return (
      <Badge variant="solid" color="success" size="sm" startIcon={<CheckGlyph />}>
        Active
      </Badge>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-theme-xs font-medium uppercase tracking-wide text-white"
      style={{ backgroundColor: PAYMENT_REQUIRED_BG }}
    >
      <LockGlyph />
      Payment required
    </span>
  );
};
