"use client";

import type React from "react";
import { useProfile } from "@/hooks/useProfile";
import { DashboardStateMessage } from "./dashboard-state-message";
import { AdminDashboard } from "./admin-dashboard";
import { TrainerDashboard } from "./trainer-dashboard";
import { TraineeDashboard } from "./trainee-dashboard";

export const DashboardHome = (): React.ReactNode => {
  const { user, isLoading, error } = useProfile();

  if (isLoading) {
    return <DashboardStateMessage variant="loading" />;
  }
  if (error) {
    return <DashboardStateMessage variant="error" message={error.message} />;
  }
  if (!user) {
    return <DashboardStateMessage variant="empty" message="Please sign in to view your dashboard." />;
  }

  const role = user.role as string;
  if (role === "ADMIN") {
    return <AdminDashboard />;
  }
  if (role === "TRAINER") {
    return <TrainerDashboard />;
  }
  if (role === "TRAINEE") {
    return <TraineeDashboard />;
  }

  return <DashboardStateMessage variant="empty" message="Unsupported role for this dashboard." />;
};
