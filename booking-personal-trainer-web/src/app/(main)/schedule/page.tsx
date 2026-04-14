import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ScheduleContent from "@/components/schedule/ScheduleContent";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Schedule | Booking Personal Trainer",
  description: "Manage your availability and time off",
};

export default function SchedulePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Schedule" />
      <ScheduleContent />
    </div>
  );
}

