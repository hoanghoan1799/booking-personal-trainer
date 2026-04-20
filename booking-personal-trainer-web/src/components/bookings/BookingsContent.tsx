"use client";

import { useMemo, useState } from "react";
import type { Booking } from "@/services/bookings/bookings.service";
import { useBookings } from "@/hooks/useBookings";
import { useProfile } from "@/hooks/useProfile";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CreateBookingModal from "@/components/users/CreateBookingModal";
import BookingDetailModal from "@/components/bookings/BookingDetailModal";
import { formatInstantUtc } from "@/lib/date-time/utc-date-time.helper";

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
  return formatInstantUtc(iso, "ddd, D MMM YYYY, HH:mm");
}

type DisplayUser = {
  readonly id: string;
  readonly userName: string;
  readonly firstName?: string;
  readonly lastName?: string;
};

const buildGroupLabel = (input: {
  readonly groupBy: "TRAINER" | "TRAINEE";
  readonly user: DisplayUser | null | undefined;
}): string => {
  if (!input.user) {
    return input.groupBy === "TRAINER" ? "Trainer: —" : "Trainee: —";
  }
  const name = getDisplayName(input.user);
  return input.groupBy === "TRAINER" ? `Trainer: ${name}` : `Trainee: ${name}`;
};

const groupBookingsBy = (input: {
  readonly bookings: readonly Booking[];
  readonly groupBy: "TRAINER" | "TRAINEE";
}): ReadonlyArray<{
  readonly key: string;
  readonly label: string;
  readonly bookings: readonly Booking[];
}> => {
  const groups = new Map<string, { label: string; bookings: Booking[] }>();
  for (const booking of input.bookings) {
    const user =
      input.groupBy === "TRAINER"
        ? (booking.trainer as DisplayUser | null | undefined)
        : (booking.trainee as DisplayUser | null | undefined);
    const key = user?.id ?? "unknown";
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        label: buildGroupLabel({ groupBy: input.groupBy, user }),
        bookings: [booking],
      });
      continue;
    }
    existing.bookings.push(booking);
  }
  return [...groups.entries()]
    .map(([key, value]) => ({ key, label: value.label, bookings: value.bookings }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
};

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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const isTrainee = user?.role === "TRAINEE";
  const currentRole = (user?.role as string | undefined) ?? null;
  const groupBy: "TRAINER" | "TRAINEE" =
    currentRole === "TRAINER" ? "TRAINEE" : "TRAINER";
  const groupedBookings = useMemo(
    () => groupBookingsBy({ bookings, groupBy }),
    [bookings, groupBy],
  );

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
      <div className="flex flex-col gap-6">
        {groupedBookings.map((group) => (
          <section key={group.key} aria-label={group.label}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {group.label}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {group.bookings.length} bookings
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {group.bookings.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      setSelectedBooking(b);
                    }}
                    className="w-full text-left"
                    aria-label="Open booking details"
                  >
                    <BookingCard booking={b} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <CreateBookingModal
        isOpen={isCreateBookingOpen}
        onClose={() => setIsCreateBookingOpen(false)}
        trainer={null}
        onSuccess={() => {
          setIsCreateBookingOpen(false);
          refetch();
        }}
      />
      <BookingDetailModal
        isOpen={selectedBooking !== null}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdated={() => {
          setSelectedBooking(null);
          refetch();
        }}
      />
    </>
  );
}
