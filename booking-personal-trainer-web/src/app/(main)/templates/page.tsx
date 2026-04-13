import type { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TemplatesContent from "@/components/templates/TemplatesContent";

export const metadata: Metadata = {
  title: "Templates | Booking Personal Trainer",
  description: "View and manage your templates",
};

export default function TemplatesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Templates" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Templates
        </h3>
        <TemplatesContent />
      </div>
    </div>
  );
}
