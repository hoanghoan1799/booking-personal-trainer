"use client";

import { useState } from "react";
import dayjs from "dayjs";
import type { User } from "@/types/user.types";
import { createBooking } from "@/services/bookings/bookings.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: User | null;
  onSuccess: () => void;
}

const DATETIME_LOCAL_FORMAT = "YYYY-MM-DDTHH:mm";

const getDisplayName = (user: User | null) => {
  if (!user) return "";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
};

/** Earliest start: now + 30 min, rounded up to next 30-min slot (matches BE MUST_BOOK_BEFORE_30_MINUTES) */
function getEarliestStartTime(): dayjs.Dayjs {
  const base = dayjs().add(30, "minute");
  const roundedMinute = Math.ceil(base.minute() / 30) * 30;
  if (roundedMinute >= 60) {
    return base.add(1, "hour").minute(0).second(0).millisecond(0);
  }
  return base.minute(roundedMinute).second(0).millisecond(0);
}

function getDefaultStartTime(): string {
  return getEarliestStartTime().format(DATETIME_LOCAL_FORMAT);
}

function getDefaultEndTime(): string {
  return getEarliestStartTime().add(1, "hour").format(DATETIME_LOCAL_FORMAT);
}

function getMinStartTime(): string {
  return getEarliestStartTime().format(DATETIME_LOCAL_FORMAT);
}

export default function CreateBookingModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
}: CreateBookingModalProps) {
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer) return;

    setIsSubmitting(true);
    setError(null);

    const startISO = dayjs(startTime).toISOString();
    const endISO = dayjs(endTime).toISOString();

    try {
      await createBooking({
        trainerId: trainer.id,
        startTime: startISO,
        endTime: endISO,
      });
      toast.success("Booking created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create booking");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartTime(getDefaultStartTime());
    setEndTime(getDefaultEndTime());
    setError(null);
    onClose();
  };

  if (!trainer) return null;

  const displayName = getDisplayName(trainer);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Book Session
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Book a session with <span className="font-medium text-gray-700 dark:text-gray-300">{displayName}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="start-time"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Start Time
          </label>
          <input
            id="start-time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            min={getMinStartTime()}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            required
            aria-label="Session start time"
          />
        </div>
        <div>
          <label
            htmlFor="end-time"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            End Time
          </label>
          <input
            id="end-time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            required
            aria-label="Session end time"
          />
        </div>
        {error && (
          <p className="text-sm text-error-600 dark:text-error-500">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Booking..." : "Book"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
