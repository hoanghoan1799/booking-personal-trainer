"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { EventInput } from "@fullcalendar/core";
import { formatInstantUtc } from "@/lib/date-time/utc-date-time.helper";
import dayjs from "@/lib/date-time/utc-dayjs";
import type { Booking } from "@/services/bookings/bookings.service";
import { getBookings, updateBookingStatus } from "@/services/bookings/bookings.service";
import { useProfile } from "@/hooks/useProfile";
import { Modal } from "@/components/ui/modal";
import CreateBookingFromCalendarModal from "@/components/bookings/CreateBookingFromCalendarModal";
import Badge from "@/components/ui/badge/Badge";
import { useToast } from "@/context/ToastContext";

interface BookingEvent extends EventInput {
  extendedProps: {
    booking: Booking;
    status: string;
    isPast: boolean;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  CONFIRMED: "success",
  REJECTED: "error",
  CANCELLED: "error",
};

function getStatusBadgeColor(status: string): "primary" | "success" | "error" | "warning" | "info" {
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

function getDisplayName(user?: { firstName?: string; lastName?: string; userName?: string } | null): string {
  if (!user) return "—";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return user.userName?.trim() ? user.userName : "—";
}

function formatDateTime(iso: string) {
  return formatInstantUtc(iso, "ddd, D MMM YYYY, HH:mm");
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
  const [selectedDateLocal, setSelectedDateLocal] = useState<string | null>(null);
  const [prefilledStartClockTime, setPrefilledStartClockTime] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const calendarRef = useRef<FullCalendar>(null);
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const toast = useToast();

  const fetchBookings = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getBookings({ limit: 200 });
      const now = dayjs();
      const bookingEvents: BookingEvent[] = res.bookings.map((b) => {
        const trainerName = b.trainer ? getDisplayName(b.trainer) : "—";
        const traineeName = b.trainee ? getDisplayName(b.trainee) : "—";
        const title = `${trainerName} – ${traineeName}`;
        const colorKey = STATUS_COLORS[b.status] ?? "primary";
        const endDate = dayjs(b.endTime);
        const isPast = endDate.isValid() && endDate.valueOf() < now.valueOf();

        return {
          id: b.id,
          title,
          start: b.startTime,
          end: b.endTime,
          extendedProps: {
            booking: b,
            status: colorKey,
            isPast,
          },
        };
      });
      setEvents(bookingEvents);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isProfileLoading) return;
    fetchBookings();
  }, [fetchBookings, isProfileLoading]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps as {
      booking: Booking;
      isPast: boolean;
    };
    setSelectedBooking(props.booking);
    setIsModalOpen(true);
  };

  const handleDateClick = (clickInfo: DateClickArg) => {
    if (currentUser?.role !== "TRAINEE") return;
    const clicked = dayjs(clickInfo.date);
    if (!clicked.isValid()) return;
    const today = dayjs().startOf("day");
    const clickedDay = clicked.startOf("day");
    if (clickedDay.isBefore(today)) return;
    const dateLocal = clicked.format("YYYY-MM-DD");
    const timeLocal = clicked.format("HH:mm");
    setSelectedDateLocal(dateLocal);
    setPrefilledStartClockTime(timeLocal);
    setIsCreateBookingOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleOpenRejectModal = () => {
    if (!selectedBooking) return;
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectReason("");
  };

  const canUpdateStatus = selectedBooking && currentUser && (
    currentUser.role === "ADMIN" ||
    (currentUser.role === "TRAINER" && selectedBooking.trainer?.id === currentUser.id)
  ) && selectedBooking.status === "PENDING";

  const handleUpdateStatus = async (status: "CONFIRMED" | "REJECTED") => {
    if (!selectedBooking || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateBookingStatus(selectedBooking.id, {
        status,
        rejectionReason:
          status === "REJECTED" ? rejectReason.trim() : undefined,
      });
      toast.success(status === "CONFIRMED" ? "Booking approved" : "Booking rejected");
      handleCloseRejectModal();
      handleCloseModal();
      fetchBookings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update booking status";
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps as {
      status: string;
      isPast: boolean;
    };
    const colorClass = `fc-bg-${props.status}`;
    const isConfirmed = props.status === "success";

    return (
      <div
        className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm ${props.isPast ? "opacity-60" : ""} ${isConfirmed ? "border-l-4 border-l-success-500" : ""}`}
      >
        <div className="fc-daygrid-event-dot" />
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading calendar...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={false}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          dayCellClassNames={(arg) => {
            const cellDay = dayjs(arg.date).startOf("day");
            const today = dayjs().startOf("day");
            if (!cellDay.isValid()) return [];
            if (cellDay.isBefore(today)) {
              return ["opacity-50", "cursor-not-allowed"];
            }
            if (currentUser?.role !== "TRAINEE") return [];
            return ["cursor-pointer"];
          }}
          height="auto"
        />
      </div>

      <CreateBookingFromCalendarModal
        isOpen={isCreateBookingOpen}
        selectedDateLocal={selectedDateLocal ?? dayjs.utc().format("YYYY-MM-DD")}
        prefilledStartClockTime={prefilledStartClockTime}
        onClose={() => {
          setIsCreateBookingOpen(false);
          setSelectedDateLocal(null);
          setPrefilledStartClockTime(null);
        }}
        onSuccess={() => {
          setIsCreateBookingOpen(false);
          setSelectedDateLocal(null);
          setPrefilledStartClockTime(null);
          fetchBookings();
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-md p-6"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Booking Details
            </h5>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  Trainer:{" "}
                </span>
                <span className="text-gray-800 dark:text-white/90">
                  {getDisplayName(selectedBooking.trainer)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  Trainee:{" "}
                </span>
                <span className="text-gray-800 dark:text-white/90">
                  {getDisplayName(selectedBooking.trainee)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  Status:{" "}
                </span>
                <Badge color={getStatusBadgeColor(selectedBooking.status)} size="sm">
                  {selectedBooking.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  Start:{" "}
                </span>
                <span className="text-gray-800 dark:text-white/90">
                  {formatDateTime(selectedBooking.startTime)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  End:{" "}
                </span>
                <span className="text-gray-800 dark:text-white/90">
                  {formatDateTime(selectedBooking.endTime)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {canUpdateStatus && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("CONFIRMED")}
                    disabled={isUpdating}
                    className="rounded-lg bg-success-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
                    aria-label="Approve booking"
                  >
                    {isUpdating ? "Updating…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRejectModal}
                    disabled={isUpdating}
                    className="rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
                    aria-label="Reject booking"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={handleCloseRejectModal}
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Rejection reason
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please provide a reason before rejecting this booking.
          </p>
          <label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason *
            </span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              aria-label="Rejection reason"
              placeholder="Write a short reason..."
              className="mt-1 min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseRejectModal}
              disabled={isUpdating}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              aria-label="Cancel rejection"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleUpdateStatus("REJECTED")}
              disabled={isUpdating || rejectReason.trim().length < 3}
              className="rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
              aria-label="Confirm rejection"
            >
              {isUpdating ? "Rejecting…" : "Reject booking"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;
