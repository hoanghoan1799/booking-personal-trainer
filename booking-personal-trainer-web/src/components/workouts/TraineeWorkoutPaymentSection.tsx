"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe";
import {
  createWorkoutPaymentIntent,
  getWorkoutPaymentAccess,
  type WorkoutPaymentAccess,
} from "@/services/payments/workout-payments.service";
import { getErrorMessage } from "@/lib/error.utils";
import Button from "@/components/ui/button/Button";

type TraineeWorkoutPaymentSectionProps = {
  readonly workoutId: string;
  readonly onPaid: () => void;
};

const formatQuotedPrice = (access: WorkoutPaymentAccess): string => {
  if (access.amountCents == null || access.currency == null) {
    return "—";
  }
  const major = access.amountCents / 100;
  return `${major.toFixed(2)} ${access.currency}`;
};

const StripePayForm = (props: {
  readonly workoutId: string;
  readonly onPaid: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);

  const wait = async (ms: number): Promise<void> => {
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms);
    });
  };

  const pollUntilPaid = async (): Promise<boolean> => {
    const maxWaitMs = 30_000;
    const start = Date.now();
    let nextDelayMs = 500;
    for (;;) {
      const snapshot = await getWorkoutPaymentAccess(props.workoutId);
      if (snapshot.isPaid) {
        return true;
      }
      const elapsedMs = Date.now() - start;
      if (elapsedMs >= maxWaitMs) {
        return false;
      }
      await wait(nextDelayMs);
      nextDelayMs = Math.min(nextDelayMs + 500, 3000);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    if (hasConfirmed) {
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    const returnUrl =
      typeof window !== "undefined" && window.location.href
        ? window.location.href
        : undefined;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: returnUrl ? { return_url: returnUrl } : {},
      redirect: "if_required",
    });
    if (error) {
      setMessage(error.message ?? "Payment failed");
      setIsSubmitting(false);
      return;
    }
    setHasConfirmed(true);
    setMessage("Payment confirmed. Unlocking workout…");
    const isPaid = await pollUntilPaid();
    if (isPaid) {
      props.onPaid();
      setIsSubmitting(false);
      return;
    }
    setMessage(
      "Payment succeeded in Stripe, but the server is still syncing. Please wait a few seconds and reopen this workout if it remains locked.",
    );
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <PaymentElement />
      {message ? (
        <p className="text-sm text-error-600 dark:text-error-500" role="alert">
          {message}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={!stripe || !elements || isSubmitting || hasConfirmed}>
        {hasConfirmed ? "Unlocking…" : isSubmitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
};

export default function TraineeWorkoutPaymentSection(
  props: TraineeWorkoutPaymentSectionProps,
) {
  const [access, setAccess] = useState<WorkoutPaymentAccess | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState<boolean>(false);

  const reloadAccess = useCallback(async () => {
    try {
      const snapshot = await getWorkoutPaymentAccess(props.workoutId);
      setAccess(snapshot);
      setAccessError(null);
      if (snapshot.isPaid) {
        setClientSecret(null);
      }
    } catch (err) {
      setAccessError(getErrorMessage(err, "Could not load payment status"));
    }
  }, [props.workoutId]);

  useEffect(() => {
    void getStripe().then((s) => {
      setStripeAvailable(s != null);
    });
  }, []);

  useEffect(() => {
    void reloadAccess();
  }, [reloadAccess]);

  const handlePreparePayment = async () => {
    setIntentError(null);
    setIsLoadingIntent(true);
    try {
      const snapshot = await getWorkoutPaymentAccess(props.workoutId);
      if (snapshot.isPaid || snapshot.view === "FULL") {
        setClientSecret(null);
        setAccess(snapshot);
        props.onPaid();
        setIsLoadingIntent(false);
        return;
      }
      const intent = await createWorkoutPaymentIntent(props.workoutId);
      setClientSecret(intent.clientSecret);
    } catch (err) {
      const msg = getErrorMessage(err, "Could not start payment");
      if (msg.toLowerCase().includes("already paid")) {
        await reloadAccess();
        props.onPaid();
        setIsLoadingIntent(false);
        return;
      }
      setIntentError(msg);
    } finally {
      setIsLoadingIntent(false);
    }
  };

  const handlePaid = () => {
    void reloadAccess();
    props.onPaid();
  };

  if (!stripeAvailable) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        Add{" "}
        <code className="rounded bg-white/60 px-1 py-0.5 text-xs dark:bg-black/30">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        </code>{" "}
        to <code className="rounded bg-white/60 px-1 py-0.5 text-xs dark:bg-black/30">.env.local</code>{" "}
        (Stripe Dashboard → Developers → API keys → Publishable key). Restart{" "}
        <code className="rounded bg-white/60 px-1 py-0.5 text-xs dark:bg-black/30">pnpm dev</code>.
      </div>
    );
  }

  if (accessError) {
    return (
      <p className="text-sm text-error-600 dark:text-error-500" role="alert">
        {accessError}
      </p>
    );
  }

  if (!access) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading payment options…</p>
    );
  }

  if (access.isPaid || access.view === "FULL") {
    return (
      <p className="text-sm font-medium text-success-700 dark:text-success-500">
        This workout is paid. You have full access.
      </p>
    );
  }

  const elementsOptions: StripeElementsOptions | undefined =
    clientSecret != null
      ? { clientSecret, appearance: { theme: "stripe" } }
      : undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Unlock workout</p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Amount due (from billing quote):{" "}
        <span className="font-medium text-gray-900 dark:text-white/90">{formatQuotedPrice(access)}</span>
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Payment goes to the platform first. After you pay, the webhook marks this workout as unlocked. Your trainer
        receives their share via a separate Connect transfer once they have completed Stripe onboarding (otherwise
        payout stays pending on our side).
      </p>
      {!clientSecret ? (
        <div className="mt-3">
          {intentError ? (
            <p className="mb-2 text-sm text-error-600 dark:text-error-500" role="alert">
              {intentError}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={handlePreparePayment}
            disabled={isLoadingIntent}
            aria-label="Continue to Stripe payment"
          >
            {isLoadingIntent ? "Preparing…" : "Continue to payment"}
          </Button>
        </div>
      ) : elementsOptions ? (
        <Elements key={clientSecret} stripe={getStripe()} options={elementsOptions}>
          <StripePayForm workoutId={props.workoutId} onPaid={handlePaid} />
        </Elements>
      ) : null}
    </div>
  );
}
