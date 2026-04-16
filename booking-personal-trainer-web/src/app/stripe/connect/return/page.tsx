import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Stripe Connect | Booking Personal Trainer",
  description: "Returning from Stripe Connect onboarding",
};

export default function StripeConnectReturnPage(): never {
  redirect("/profile");
}

