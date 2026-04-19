"use client";

import type React from "react";
import type { Workout } from "@/services/workouts/workouts.service";
import { getUserDisplayName } from "@/lib/user-display";
import { WorkoutStatusBadge } from "./workout-status-badge";

export type WorkoutsTablePerspective = "admin" | "trainer" | "trainee";

export type WorkoutsTableProps = {
  readonly workouts: Workout[];
  readonly perspective: WorkoutsTablePerspective;
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

export const WorkoutsTable = (props: WorkoutsTableProps): React.ReactNode => {
  const { workouts, perspective, emptyLabel = "No workouts in this view." } = props;
  if (workouts.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-white/[0.04]">
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
            <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {workouts.map((w) => {
            const total = w.totalExercises ?? w.exercises?.length ?? 0;
            const done = w.completedExercises ?? 0;
            return (
              <tr key={w.id} className="bg-white dark:bg-transparent">
                {perspective === "admin" ? (
                  <>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                      {getUserDisplayName(w.trainee)}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                      {getUserDisplayName(w.trainer)}
                    </td>
                  </>
                ) : null}
                {perspective === "trainer" ? (
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    {getUserDisplayName(w.trainee)}
                  </td>
                ) : null}
                {perspective === "trainee" ? (
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    {getUserDisplayName(w.trainer)}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <WorkoutStatusBadge status={w.status} />
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(w.startTime)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {total > 0 ? `${done} / ${total}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
