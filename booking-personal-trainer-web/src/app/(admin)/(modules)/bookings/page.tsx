import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Bookings | Booking Personal Trainer",
  description: "Manage your PT session bookings",
};

export default function BookingsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bookings" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Bookings
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your personal trainer session bookings will appear here.
        </p>
      </div>
    </div>
  );
}
