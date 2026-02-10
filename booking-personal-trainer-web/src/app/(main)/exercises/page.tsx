import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExercisesContent from "@/components/exercises/ExercisesContent";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Exercises | Booking Personal Trainer",
  description: "Browse and manage exercises",
};

export default function ExercisesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Exercises" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Exercises
        </h3>
        <ExercisesContent />
      </div>
    </div>
  );
}
