import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EarningsContent from "@/components/earnings/EarningsContent";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Finance | Booking Personal Trainer",
  description: "View finance summary (admin)",
};

export default function FinancePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Finance" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Finance
        </h3>
        <EarningsContent />
      </div>
    </div>
  );
}

