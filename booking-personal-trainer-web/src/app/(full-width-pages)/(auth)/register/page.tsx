import SignUpForm from "@/components/auth/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Booking Personal Trainer",
  description: "Create your account",
};

export default function RegisterPage() {
  return <SignUpForm />;
}
