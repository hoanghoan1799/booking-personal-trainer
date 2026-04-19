import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata: Metadata = {
  title: "Dashboard | Booking Personal Trainer",
  description: "Booking Personal Trainer dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHome />
    </div>
  );
}
