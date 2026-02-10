import ProfileContent from "@/components/user-profile/ProfileContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Booking Personal Trainer",
  description: "View and manage your profile",
};

export default function ProfilePage() {
  return <ProfileContent />;
}
