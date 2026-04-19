"use client";

import type React from "react";
import Badge from "@/components/ui/badge/Badge";

const statusToColor = (status: string): "primary" | "success" | "error" | "warning" | "info" => {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "CANCELLED":
      return "error";
    case "REJECTED":
      return "warning";
    case "PENDING":
    default:
      return "info";
  }
};

export type BookingStatusBadgeProps = {
  readonly status: string;
};

export const BookingStatusBadge = (props: BookingStatusBadgeProps): React.ReactNode => {
  const { status } = props;
  return (
    <Badge color={statusToColor(status)} size="sm">
      {status}
    </Badge>
  );
};
