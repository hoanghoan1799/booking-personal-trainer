"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useProfile } from "@/hooks/useProfile";
import UserAddressCard from "./UserAddressCard";
import UserInfoCard from "./UserInfoCard";
import UserMetaCard from "./UserMetaCard";
import TrainerStripeConnectCard from "./TrainerStripeConnectCard";

export default function ProfileContent() {
  const { user, isLoading, error, refetch, updateUser } = useProfile();

  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Profile" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <p className="text-sm text-error-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={user} />
          <UserInfoCard
            user={user}
            onProfileUpdated={(updatedUser) => {
              updateUser(updatedUser);
            }}
          />
          <TrainerStripeConnectCard
            user={user}
            onConnected={(stripeAccountId) => {
              updateUser({ stripeAccountId });
            }}
          />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}
