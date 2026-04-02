import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WorkoutsContent from "@/components/workouts/WorkoutsContent";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Workouts | Booking Personal Trainer",
  description: "Manage workouts",
};

export default function WorkoutsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Workouts" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Workouts
        </h3>
        <WorkoutsContent />
      </div>
    </div>
  );
}
