"use client";

import type React from "react";

export type DashboardStatCardProps = {
  readonly label: string;
  readonly value: string | number;
  readonly hint?: string;
  readonly icon?: React.ReactNode;
};

export const DashboardStatCard = (props: DashboardStatCardProps): React.ReactNode => {
  const { label, value, hint, icon } = props;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
