"use client";

import type React from "react";

export type DashboardSectionProps = {
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
};

export const DashboardSection = (props: DashboardSectionProps): React.ReactNode => {
  const { title, description, action, children } = props;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
};
