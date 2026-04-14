"use client";

import { useState } from "react";
import type { Booking } from "@/services/bookings/bookings.service";
import { useBookings } from "@/hooks/useBookings";
import { useProfile } from "@/hooks/useProfile";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CreateBookingModal from "@/components/users/CreateBookingModal";

function getDisplayName(user: { firstName?: string; lastName?: string; userName: string }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
}

function getStatusColor(status: string): "primary" | "success" | "error" | "warning" | "info" {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "REJECTED":
    case "CANCELLED":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "info";
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function BookingCard({ booking }: { booking: Booking }) {
  const trainerName = booking.trainer
    ? getDisplayName(booking.trainer)
    : "—";
  const traineeName = booking.trainee
    ? getDisplayName(booking.trainee)
    : "—";

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
      role="listitem"
    >
      <div className="flex items-center gap-2">
        <Badge color={getStatusColor(booking.status)} size="sm">
          {booking.status}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-500 dark:text-gray-500">Trainer:</span> {trainerName}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-500 dark:text-gray-500">Trainee:</span> {traineeName}
        </span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {formatDateTime(booking.startTime)} – {formatDateTime(booking.endTime)}
      </span>
    </div>
  );
}

export default function BookingsContent() {
  const { bookings, isLoading, error, refetch } = useBookings();
  const { user, isLoading: isProfileLoading } = useProfile();
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState<boolean>(false);
  const isTrainee = user?.role === "TRAINEE";

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading bookings...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-sm text-error-600 dark:text-error-500">
          {error.message}
        </p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <>
        {isTrainee && (
          <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-base font-semibold text-gray-800 dark:text-white/90">
                Book a session
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose expected time first or choose trainer first.
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsCreateBookingOpen(true)}
              aria-label="Create booking"
            >
              Create booking
            </Button>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No bookings yet.
        </p>
        <CreateBookingModal
          isOpen={isCreateBookingOpen}
          onClose={() => setIsCreateBookingOpen(false)}
          trainer={null}
          onSuccess={() => {
            setIsCreateBookingOpen(false);
            refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      {isTrainee && (
        <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold text-gray-800 dark:text-white/90">
              Book a session
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose expected time first or choose trainer first.
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsCreateBookingOpen(true)}
            aria-label="Create booking"
          >
            Create booking
          </Button>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {bookings.map((b) => (
          <li key={b.id}>
            <BookingCard booking={b} />
          </li>
        ))}
      </ul>
      <CreateBookingModal
        isOpen={isCreateBookingOpen}
        onClose={() => setIsCreateBookingOpen(false)}
        trainer={null}
        onSuccess={() => {
          setIsCreateBookingOpen(false);
          refetch();
        }}
      />
    </>
  );
}
