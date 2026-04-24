import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersContent from "@/components/users/UsersContent";
import { TikTokQuickAccessCard } from "@/components/dashboard/tiktok-quick-access-card";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Users | Booking Personal Trainer",
  description: "Manage users (admin)",
};

export default function UsersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Users</h3>
          <TikTokQuickAccessCard className="w-full max-w-[320px] sm:shrink-0 sm:self-start sm:justify-self-end" />
        </div>
        <UsersContent />
      </div>
    </div>
  );
}
