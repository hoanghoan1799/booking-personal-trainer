import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Stripe Connect | Booking Personal Trainer",
  description: "Refresh Stripe Connect onboarding",
};

export default function StripeConnectRefreshPage(): never {
  redirect("/profile");
}

