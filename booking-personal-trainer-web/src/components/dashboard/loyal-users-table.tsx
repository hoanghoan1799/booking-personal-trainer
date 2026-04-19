"use client";

import type React from "react";
import type { LoyalUserRow } from "@/services/reporting/reporting.service";

export type LoyalUsersTableProps = {
  readonly rows: LoyalUserRow[];
  readonly rankLabel?: string;
};

export const LoyalUsersTable = (props: LoyalUsersTableProps): React.ReactNode => {
  const { rows, rankLabel = "#" } = props;
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
        No loyalty data for this period.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-white/[0.04]">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">{rankLabel}</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">User</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Email</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Bookings</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Confirmed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {rows.map((row, index) => (
            <tr key={row.userId} className="bg-white dark:bg-transparent">
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{row.userName}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.userEmail}</td>
              <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{row.bookingsCount}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.confirmedBookingsCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
