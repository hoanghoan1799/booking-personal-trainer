"use client";

import type React from "react";
import type { TrainerKpiRow } from "@/services/reporting/reporting.service";
import { formatCents } from "@/lib/format-money";

export type TrainerKpiTableProps = {
  readonly rows: TrainerKpiRow[];
};

export const TrainerKpiTable = (props: TrainerKpiTableProps): React.ReactNode => {
  const { rows } = props;
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
        No trainer KPI data for this period.
      </p>
    );
  }
  return (
    <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-white/[0.04]">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Trainer</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Confirmed</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Cancelled</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Rejected</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Workouts</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Minutes</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Share (net)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {rows.map((r) => (
            <tr key={r.trainerId} className="bg-white dark:bg-transparent">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800 dark:text-gray-100">{r.trainerName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{r.trainerEmail}</div>
              </td>
              <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{r.confirmedBookingsCount}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.cancelledBookingsCount}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.rejectedBookingsCount}</td>
              <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{r.workoutsDoneCount}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.deliveredMinutes}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {formatCents(r.trainerShareNetCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
