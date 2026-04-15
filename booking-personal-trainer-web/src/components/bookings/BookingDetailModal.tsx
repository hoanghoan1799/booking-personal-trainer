"use client";

import { useMemo, useState } from "react";
import type { Booking, BookingStatus } from "@/services/bookings/bookings.service";
import { updateBookingStatus } from "@/services/bookings/bookings.service";
import { useProfile } from "@/hooks/useProfile";
import { useTemplates } from "@/hooks/useTemplates";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import CreateWorkoutFromTemplateModal from "@/components/bookings/CreateWorkoutFromTemplateModal";

function getDisplayName(user: { firstName?: string; lastName?: string; userName: string }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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

type ActionMode = "NONE" | "CANCEL" | "REJECT";

export default function BookingDetailModal(props: {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user } = useProfile();
  const { templates } = useTemplates();
  const toast = useToast();
  const [mode, setMode] = useState<ActionMode>("NONE");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateWorkoutOpen, setIsCreateWorkoutOpen] = useState<boolean>(false);

  const booking = props.booking;
  const role = (user?.role as string | undefined) ?? null;
  const isTrainer = role === "TRAINER";
  const isTrainee = role === "TRAINEE";
  const isAdmin = role === "ADMIN";

  const canCancel = useMemo(() => {
    if (!booking || !role) return false;
    if (booking.status === "CANCELLED" || booking.status === "REJECTED") return false;
    if (isAdmin) return true;
    if (isTrainer && booking.trainer?.id === user?.id) return true;
    if (isTrainee && booking.trainee?.id === user?.id) return true;
    return false;
  }, [booking, isAdmin, isTrainee, isTrainer, role, user?.id]);

  const canReject = useMemo(() => {
    if (!booking || !role) return false;
    if (booking.status !== "PENDING") return false;
    if (isAdmin) return true;
    return isTrainer && booking.trainer?.id === user?.id;
  }, [booking, isAdmin, isTrainer, role, user?.id]);

  const canApprove = useMemo(() => {
    if (!booking || !role) return false;
    if (booking.status !== "PENDING") return false;
    if (isAdmin) return true;
    return isTrainer && booking.trainer?.id === user?.id;
  }, [booking, isAdmin, isTrainer, role, user?.id]);

  const canCreateWorkout = useMemo(() => {
    if (!booking) return false;
    if (!isTrainer && !isAdmin) return false;
    if (booking.status !== "CONFIRMED") return false;
    if (isAdmin) return true;
    return booking.trainer?.id === user?.id;
  }, [booking, isAdmin, isTrainer, user?.id]);

  const handleClose = () => {
    setMode("NONE");
    setReason("");
    setError(null);
    setIsSubmitting(false);
    props.onClose();
  };

  const handleSubmitStatus = async (status: BookingStatus) => {
    if (!booking) return;
    const trimmedReason = reason.trim();
    if (status === "CANCELLED" && trimmedReason.length < 3) {
      setError("Cancellation reason is required");
      return;
    }
    if (status === "REJECTED" && trimmedReason.length < 3) {
      setError("Rejection reason is required");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateBookingStatus(booking.id, {
        status,
        cancellationReason: status === "CANCELLED" ? trimmedReason : undefined,
        rejectionReason: status === "REJECTED" ? trimmedReason : undefined,
      });
      toast.success("Booking updated");
      props.onUpdated();
      setMode("NONE");
      setReason("");
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to update booking");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateBookingStatus(booking.id, { status: "CONFIRMED" });
      toast.success("Booking approved");
      props.onUpdated();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to approve booking");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  const trainerName = booking.trainer ? getDisplayName(booking.trainer) : "—";
  const traineeName = booking.trainee ? getDisplayName(booking.trainee) : "—";

  return (
    <>
      <Modal isOpen={props.isOpen} onClose={handleClose} className="max-w-2xl p-6">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Booking details
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Preview booking and take actions.
              </p>
            </div>
            <Badge color={getStatusColor(booking.status)} size="sm">
              {booking.status}
            </Badge>
          </div>

          <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/40 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Trainer
              </p>
              <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{trainerName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Trainee
              </p>
              <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{traineeName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Start
              </p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDateTime(booking.startTime)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                End
              </p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDateTime(booking.endTime)}</p>
            </div>
          </div>

          {booking.rejectionReason ? (
            <div className="rounded-xl border border-error-500/20 bg-error-500/10 p-4 text-sm text-error-700 dark:text-error-300">
              <p className="font-semibold">Rejected reason</p>
              <p className="mt-1">{booking.rejectionReason}</p>
            </div>
          ) : null}

          {booking.cancellationReason ? (
            <div className="rounded-xl border border-error-500/20 bg-error-500/10 p-4 text-sm text-error-700 dark:text-error-300">
              <p className="font-semibold">Cancellation reason</p>
              <p className="mt-1">{booking.cancellationReason}</p>
            </div>
          ) : null}

          {canCreateWorkout ? (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Workout
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Create a workout from a template for this booking.
                  </p>
                </div>
                <Button onClick={() => setIsCreateWorkoutOpen(true)} aria-label="Create workout">
                  Create workout
                </Button>
              </div>
            </div>
          ) : null}

          {(canApprove || canCancel || canReject) ? (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Actions</p>
              {error && mode === "NONE" ? (
                <p className="mt-2 text-sm text-error-600 dark:text-error-500" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {canApprove ? (
                  <Button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    aria-label="Approve booking"
                    className="bg-success-600 text-white hover:bg-success-700 disabled:bg-success-300"
                  >
                    {isSubmitting ? "Approving…" : "Approve booking"}
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("CANCEL");
                      setReason("");
                      setError(null);
                    }}
                    aria-label="Cancel booking"
                    className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                  >
                    Cancel booking
                  </Button>
                ) : null}
                {canReject ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("REJECT");
                      setReason("");
                      setError(null);
                    }}
                    aria-label="Reject booking"
                    className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                  >
                    Reject booking
                  </Button>
                ) : null}
              </div>

              {mode !== "NONE" ? (
                <div className="mt-4 space-y-3">
                  <label>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {mode === "CANCEL" ? "Cancellation reason *" : "Rejection reason *"}
                    </span>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      aria-label="Reason"
                      className="mt-1 min-h-20 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      placeholder="Write a short reason..."
                    />
                  </label>
                  {error ? (
                    <p className="text-sm text-error-600 dark:text-error-500" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMode("NONE");
                        setReason("");
                        setError(null);
                      }}
                      aria-label="Cancel action"
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSubmitStatus(mode === "CANCEL" ? "CANCELLED" : "REJECTED")}
                      aria-label="Confirm action"
                      disabled={isSubmitting || reason.trim().length < 3}
                      className="bg-error-600 hover:bg-error-700 disabled:bg-error-300"
                    >
                      {isSubmitting ? "Saving..." : "Confirm"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose} aria-label="Close booking detail">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <CreateWorkoutFromTemplateModal
        isOpen={isCreateWorkoutOpen}
        onClose={() => setIsCreateWorkoutOpen(false)}
        booking={booking}
        templates={templates}
        onSuccess={() => {
          setIsCreateWorkoutOpen(false);
          props.onUpdated();
        }}
      />
    </>
  );
}

