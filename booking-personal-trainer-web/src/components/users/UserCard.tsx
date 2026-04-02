"use client";

import type { User } from "@/types/user.types";
import Badge from "@/components/ui/badge/Badge";
import RoleBadge from "./RoleBadge";

interface UserCardProps {
  user: User;
  showWaitingBadge?: boolean;
  onClick?: () => void;
}

const getDisplayName = (user: User) => {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
};

export default function UserCard({
  user,
  showWaitingBadge = false,
  onClick,
}: UserCardProps) {
  const displayName = getDisplayName(user);
  const isClickable = Boolean(onClick);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role={isClickable ? "button" : "listitem"}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800 ${
        isClickable
          ? "cursor-pointer transition-colors hover:border-brand-400 hover:bg-gray-50 dark:hover:border-brand-600 dark:hover:bg-white/[0.04]"
          : ""
      }`}
      aria-label={isClickable ? `Select ${displayName}` : undefined}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {displayName}
          </span>
          {showWaitingBadge && (
            <Badge
              color="warning"
              size="sm"
            >
              Waiting for approve
            </Badge>
          )}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {user.email}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          @{user.userName}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        <RoleBadge role={user.role} />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {user.userType}
        </span>
      </div>
    </div>
  );
}
