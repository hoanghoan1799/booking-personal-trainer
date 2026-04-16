"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { User } from "@/types/user.types";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/error.utils";
import { createTrainerStripeConnectOnboardingLink } from "@/services/payments/trainer-stripe-connect.service";

type TrainerStripeConnectCardProps = {
  readonly user: User | null;
  readonly onConnected?: (stripeAccountId: string) => void;
};

export default function TrainerStripeConnectCard(
  props: TrainerStripeConnectCardProps,
): React.ReactNode {
  const { user, onConnected } = props;
  const toast = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isTrainer = user?.role === "TRAINER";
  const hasStripeConnect = Boolean(user?.stripeAccountId);

  const title = useMemo(() => {
    if (!isTrainer) return "Stripe Payouts";
    return hasStripeConnect ? "Stripe Payouts" : "Connect Stripe to receive payouts";
  }, [hasStripeConnect, isTrainer]);

  const description = useMemo(() => {
    if (!isTrainer) {
      return "Stripe Connect is available for trainer payouts.";
    }
    if (hasStripeConnect) {
      return "Your Stripe Connect account is linked. Payouts can be transferred to your Stripe account.";
    }
    return "Connect your Stripe account so we can transfer your earnings.";
  }, [hasStripeConnect, isTrainer]);

  const handleConnect = useCallback(async () => {
    if (!isTrainer) return;
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await createTrainerStripeConnectOnboardingLink();
      onConnected?.(result.stripeAccountId);
      if (typeof window !== "undefined") {
        window.location.href = result.url;
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Could not start Stripe Connect onboarding");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isTrainer, onConnected, toast]);

  if (!isTrainer) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
          {hasStripeConnect ? (
            <div className="mt-3 rounded-lg border border-success-500/20 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300">
              Connected:{" "}
              <span className="font-medium">{user?.stripeAccountId}</span>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              Not connected yet. Your earnings will remain pending until you connect Stripe.
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto">
          <Button
            type="button"
            size="sm"
            disabled={isLoading || hasStripeConnect}
            onClick={handleConnect}
            aria-label="Connect Stripe"
          >
            {hasStripeConnect ? "Connected" : isLoading ? "Opening…" : "Connect Stripe"}
          </Button>
        </div>
      </div>
    </div>
  );
}

