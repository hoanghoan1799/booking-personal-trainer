"use client";

import type React from "react";
import type { RevenueBucketRow } from "@/services/reporting/reporting.service";
import { formatCents } from "@/lib/format-money";

export type RevenueBucketsTableProps = {
  readonly rows: RevenueBucketRow[];
};

const formatPeriod = (start: string, end: string): string => {
  try {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString()} → ${e.toLocaleDateString()}`;
  } catch {
    return `${start} → ${end}`;
  }
};

export const RevenueBucketsTable = (props: RevenueBucketsTableProps): React.ReactNode => {
  const { rows } = props;
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
        No revenue in this period.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-white/[0.04]">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Period (UTC)</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">CCY</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">GMV (net)</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Platform (net)</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Trainer (net)</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Est.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {rows.map((r) => (
            <tr key={`${r.currency}-${r.bucketStart}`} className="bg-white dark:bg-transparent">
              <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{formatPeriod(r.bucketStart, r.bucketEnd)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.currency}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCents(r.gmvNetCents)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatCents(r.platformFeeNetCents)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatCents(r.trainerShareNetCents)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.isEstimated ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
