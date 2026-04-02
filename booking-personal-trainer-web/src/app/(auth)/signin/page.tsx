import SignInForm from "@/components/auth/SignInForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Booking Personal Trainer",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return <SignInForm />;
}
