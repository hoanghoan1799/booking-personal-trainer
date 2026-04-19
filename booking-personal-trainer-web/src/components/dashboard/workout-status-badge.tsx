"use client";

import type React from "react";
import Badge from "@/components/ui/badge/Badge";

const statusToColor = (status: string): "primary" | "success" | "warning" | "info" => {
  switch (status) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "warning";
    case "PENDING":
    default:
      return "info";
  }
};

export type WorkoutStatusBadgeProps = {
  readonly status: string;
};

export const WorkoutStatusBadge = (props: WorkoutStatusBadgeProps): React.ReactNode => {
  const { status } = props;
  return (
    <Badge color={statusToColor(status)} size="sm">
      {status}
    </Badge>
  );
};
