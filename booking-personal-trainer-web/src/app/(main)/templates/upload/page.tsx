import type { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TemplatesUploadContent from "@/components/templates/TemplatesUploadContent";

export const metadata: Metadata = {
  title: "Upload Template Files | Booking Personal Trainer",
  description: "Upload and attach files to your templates",
};

export default function TemplatesUploadPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Template Upload" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Upload
        </h3>
        <TemplatesUploadContent />
      </div>
    </div>
  );
}

