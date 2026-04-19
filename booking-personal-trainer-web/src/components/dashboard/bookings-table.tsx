"use client";

import type React from "react";
import type { Booking } from "@/services/bookings/bookings.service";
import { getUserDisplayName } from "@/lib/user-display";
import { BookingStatusBadge } from "./booking-status-badge";

export type BookingsTablePerspective = "admin" | "trainer" | "trainee";

export type BookingsTableProps = {
  readonly bookings: Booking[];
  readonly perspective: BookingsTablePerspective;
  readonly emptyLabel?: string;
};

const formatDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

export const BookingsTable = (props: BookingsTableProps): React.ReactNode => {
  const { bookings, perspective, emptyLabel = "No bookings in this view." } = props;
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-white/[0.04]">
          <tr>
            {perspective === "admin" ? (
              <>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Trainee</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Trainer</th>
              </>
            ) : null}
            {perspective === "trainer" ? (
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Trainee</th>
            ) : null}
            {perspective === "trainee" ? (
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Trainer</th>
            ) : null}
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Status</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Start</th>
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">End</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {bookings.map((b) => (
            <tr key={b.id} className="bg-white dark:bg-transparent">
              {perspective === "admin" ? (
                <>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    {getUserDisplayName(b.trainee)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    {getUserDisplayName(b.trainer)}
                  </td>
                </>
              ) : null}
              {perspective === "trainer" ? (
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                  {getUserDisplayName(b.trainee)}
                </td>
              ) : null}
              {perspective === "trainee" ? (
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                  {getUserDisplayName(b.trainer)}
                </td>
              ) : null}
              <td className="px-4 py-3">
                <BookingStatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(b.startTime)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(b.endTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
