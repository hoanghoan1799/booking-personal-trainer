"use client";

import type React from "react";
import type { User } from "@/types/user.types";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { getUserDisplayName } from "@/lib/user-display";

export type TrainerDirectoryCardProps = {
  readonly trainer: User;
  readonly isExpanded: boolean;
  readonly onToggleExpand: () => void;
  readonly onBook: () => void;
};

export const TrainerDirectoryCard = (props: TrainerDirectoryCardProps): React.ReactNode => {
  const { trainer, isExpanded, onToggleExpand, onBook } = props;
  const displayName = getUserDisplayName(trainer);
  return (
    <article className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white/90">{displayName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{trainer.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge color="light" size="sm">
              {trainer.userType}
            </Badge>
            <Badge color="info" size="sm">
              {trainer.approvalStatus}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={isExpanded}
            aria-controls={`trainer-detail-${trainer.id}`}
            id={`trainer-summary-${trainer.id}`}
            onClick={onToggleExpand}
          >
            {isExpanded ? "Hide details" : "Details"}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onBook}>
            Create booking
          </Button>
        </div>
      </div>
      {isExpanded ? (
        <div
          id={`trainer-detail-${trainer.id}`}
          role="region"
          aria-labelledby={`trainer-summary-${trainer.id}`}
          className="border-t border-gray-200 px-4 py-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300"
        >
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-gray-400">Username</dt>
              <dd>{trainer.userName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-400">Status</dt>
              <dd>{trainer.status}</dd>
            </div>
            {trainer.age != null ? (
              <div>
                <dt className="text-xs font-medium uppercase text-gray-400">Age</dt>
                <dd>{trainer.age}</dd>
              </div>
            ) : null}
            {trainer.height != null ? (
              <div>
                <dt className="text-xs font-medium uppercase text-gray-400">Height</dt>
                <dd>{trainer.height}</dd>
              </div>
            ) : null}
            {trainer.weight != null ? (
              <div>
                <dt className="text-xs font-medium uppercase text-gray-400">Weight</dt>
                <dd>{trainer.weight}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </article>
  );
};
