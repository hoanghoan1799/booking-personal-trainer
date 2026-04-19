"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/context/ToastContext";
import { useTrainerSchedule } from "@/hooks/useTrainerSchedule";
import { useBookings } from "@/hooks/useBookings";
import type {
  CreateTrainerTimeOffInput,
} from "@/services/trainer-schedule/trainer-schedule.types";
import Button from "@/components/ui/button/Button";
import WeeklyScheduleCalendar from "@/components/schedule/WeeklyScheduleCalendar";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  formatInstantUtc,
  toDateTimeLocalUtcFromUtcDate,
} from "@/lib/date-time/utc-date-time.helper";
import dayjs from "@/lib/date-time/utc-dayjs";
import {
  addDays,
  buildUtcInstantFromUtcDayAndClockMinutes,
  getIsoDayOfWeek,
  getStartOfWeekMonday,
  utcInstantFromWire,
} from "@/lib/date-time/utc-weekly-calendar.helper";

type DayOption = {
  readonly dayOfWeek: number;
  readonly label: string;
};

const DAY_OPTIONS: DayOption[] = [
  { dayOfWeek: 1, label: "Mon" },
  { dayOfWeek: 2, label: "Tue" },
  { dayOfWeek: 3, label: "Wed" },
  { dayOfWeek: 4, label: "Thu" },
  { dayOfWeek: 5, label: "Fri" },
  { dayOfWeek: 6, label: "Sat" },
  { dayOfWeek: 7, label: "Sun" },
] as const;

const toDateTimeLocalFromDate = (d: Date): string => {
  return toDateTimeLocalUtcFromUtcDate(d);
};

const formatTimeFromIso = (isoString: string): string => {
  if (!dayjs.utc(isoString).isValid()) {
    return "—";
  }
  return formatInstantUtc(isoString, "HH:mm");
};

const formatDateTimeFromIso = (isoString: string): string => {
  if (!dayjs.utc(isoString).isValid()) {
    return "—";
  }
  return formatInstantUtc(isoString, "ddd, D MMM, HH:mm");
};

const buildIsoForWeekDayAndClockTime = (
  weekStartMonday: Date,
  dayOfWeek: number,
  clockTime: string,
): string => {
  const dayIndex = dayOfWeek - 1;
  const dayDate = addDays(weekStartMonday, dayIndex);
  const [hour, minute] = clockTime.split(":").map((v) => Number(v));
  return buildUtcInstantFromUtcDayAndClockMinutes(
    dayDate,
    hour * 60 + minute,
  ).toISOString();
};

const AVAILABILITY_MIN_DURATION_MINUTES = 60 as const;
const TIME_OFF_MIN_DURATION_MINUTES = 30 as const;
const SCHEDULE_TIME_STEP_MINUTES = 30 as const;
const SCHEDULE_TIME_INPUT_STEP_SECONDS = SCHEDULE_TIME_STEP_MINUTES * 60;

const isClockTimeOnThirtyMinuteStep = (clockTime: string): boolean => {
  if (!/^\d{2}:\d{2}$/.test(clockTime)) {
    return false;
  }
  const minute = Number(clockTime.slice(3, 5));
  if (Number.isNaN(minute)) {
    return false;
  }
  return minute % SCHEDULE_TIME_STEP_MINUTES === 0;
};

const isDateTimeLocalOnThirtyMinuteStep = (value: string): boolean => {
  const date = dayjs.utc(value, "YYYY-MM-DDTHH:mm", true);
  if (!date.isValid()) {
    return false;
  }
  if (date.second() !== 0 || date.millisecond() !== 0) {
    return false;
  }
  return date.minute() % SCHEDULE_TIME_STEP_MINUTES === 0;
};

const ScheduleContent: React.FC = () => {
  const { user, isLoading, error } = useProfile();
  const toast = useToast();
  const {
    availabilities,
    timeOff,
    isLoading: isScheduleLoading,
    error: scheduleError,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
  } = useTrainerSchedule();
  const { bookings } = useBookings();

  const isTrainer = useMemo((): boolean => user?.role === "TRAINER", [user?.role]);

  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<"availability" | "timeOff">(
    "availability",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<
    | { type: "availability"; id: string }
    | { type: "timeOff"; id: string }
    | { type: "booking"; id: string }
    | null
  >(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [availabilityStartClockTime, setAvailabilityStartClockTime] = useState<string>(
    "",
  );
  const [availabilityEndClockTime, setAvailabilityEndClockTime] = useState<string>("");
  const [timeOffReason, setTimeOffReason] = useState<string>("");
  const [timeOffStartDateTime, setTimeOffStartDateTime] = useState<string>("");
  const [timeOffEndDateTime, setTimeOffEndDateTime] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [availabilityWeekStartMonday, setAvailabilityWeekStartMonday] = useState<Date | null>(
    null,
  );
  const [editingAvailabilityDayLabel, setEditingAvailabilityDayLabel] = useState<string>("");
  const [isDeleteAvailabilityConfirmOpen, setIsDeleteAvailabilityConfirmOpen] =
    useState<boolean>(false);
  const [editTimeOffReason, setEditTimeOffReason] = useState<string>("");
  const [editTimeOffStartDateTime, setEditTimeOffStartDateTime] = useState<string>("");
  const [editTimeOffEndDateTime, setEditTimeOffEndDateTime] = useState<string>("");
  const [isDeleteTimeOffConfirmOpen, setIsDeleteTimeOffConfirmOpen] =
    useState<boolean>(false);

  const formatDayOfWeek = useCallback((value: number): string => {
    const mapping: Record<number, string> = {
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
      7: "Sun",
    };
    return mapping[value] ?? `Day ${value}`;
  }, []);

  const sortedAvailabilities = useMemo(() => {
    return [...availabilities].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return dayjs.utc(a.startTime).valueOf() - dayjs.utc(b.startTime).valueOf();
    });
  }, [availabilities]);

  const sortedTimeOff = useMemo(() => {
    return [...timeOff].sort(
      (a, b) => dayjs.utc(a.startTime).valueOf() - dayjs.utc(b.startTime).valueOf(),
    );
  }, [timeOff]);

  const isValidTimeRange = useCallback((startIso: string, endIso: string): boolean => {
    const start = dayjs.utc(startIso);
    const end = dayjs.utc(endIso);
    if (!start.isValid() || !end.isValid()) {
      return false;
    }
    return start.valueOf() < end.valueOf();
  }, []);

  const isValidClockTime = useCallback((value: string): boolean => {
    return /^\d{2}:\d{2}$/.test(value);
  }, []);

  const getMinutesFromClockTime = useCallback((value: string): number | null => {
    if (!isValidClockTime(value)) {
      return null;
    }
    const [h, m] = value.split(":").map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) {
      return null;
    }
    return h * 60 + m;
  }, [isValidClockTime]);

  const getIsoFromDateTimeLocal = useCallback((value: string): string => {
    return dayjs.utc(value, "YYYY-MM-DDTHH:mm", true).toISOString();
  }, []);

  const isInPastOrNow = useCallback((isoString: string): boolean => {
    const date = dayjs.utc(isoString);
    if (!date.isValid()) {
      return false;
    }
    return date.valueOf() <= Date.now();
  }, []);

  const openCreateModalFromSelection = useCallback(
    (input: { dayIndex: number; startMinute: number; endMinute: number; weekStart: Date }) => {
      setCreateModalError(null);
      const monday = getStartOfWeekMonday(input.weekStart);
      setAvailabilityWeekStartMonday(monday);
      const dayOfWeek = input.dayIndex + 1;
      const startHour = Math.floor(input.startMinute / 60);
      const startMinute = input.startMinute % 60;
      const endHour = Math.floor(input.endMinute / 60);
      const endMinute = input.endMinute % 60;
      const toClockTime = (h: number, m: number): string =>
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      setSelectedDays([dayOfWeek]);
      setAvailabilityStartClockTime(toClockTime(startHour, startMinute));
      setAvailabilityEndClockTime(toClockTime(endHour, endMinute));

      const dayDate = addDays(input.weekStart, input.dayIndex);
      const startDate = buildUtcInstantFromUtcDayAndClockMinutes(
        dayDate,
        startHour * 60 + startMinute,
      );
      const endDate = buildUtcInstantFromUtcDayAndClockMinutes(
        dayDate,
        endHour * 60 + endMinute,
      );
      setTimeOffStartDateTime(toDateTimeLocalFromDate(startDate));
      setTimeOffEndDateTime(toDateTimeLocalFromDate(endDate));

      setCreateMode("availability");
      setIsCreateModalOpen(true);
    },
    [],
  );

  const openEditModalFromEvent = useCallback(
    (input: { eventType: "availability" | "timeOff" | "booking"; id: string }) => {
      if (input.eventType === "availability") {
        const availability = availabilities.find((a) => a.id === input.id) ?? null;
        if (!availability) {
          toast.error("Availability not found");
          return;
        }
        setEditModalError(null);
        const start = utcInstantFromWire(availability.startTime);
        const end = utcInstantFromWire(availability.endTime);
        const toClockTime = (d: Date): string => {
          const utc = dayjs.utc(d);
          return `${String(utc.hour()).padStart(2, "0")}:${String(utc.minute()).padStart(2, "0")}`;
        };
        setAvailabilityStartClockTime(toClockTime(start));
        setAvailabilityEndClockTime(toClockTime(end));
        setEditingAvailabilityDayLabel(formatDayOfWeek(availability.dayOfWeek));
        setEditTarget({ type: "availability", id: availability.id });
        setIsEditModalOpen(true);
        return;
      }

      if (input.eventType === "timeOff") {
        const item = timeOff.find((t) => t.id === input.id) ?? null;
        if (!item) {
          toast.error("Time off not found");
          return;
        }
        setEditModalError(null);
        setEditTimeOffReason(item.reason);
        setEditTimeOffStartDateTime(toDateTimeLocalFromDate(utcInstantFromWire(item.startTime)));
        setEditTimeOffEndDateTime(toDateTimeLocalFromDate(utcInstantFromWire(item.endTime)));
        setIsDeleteTimeOffConfirmOpen(false);
        setEditTarget({ type: "timeOff", id: item.id });
        setIsEditModalOpen(true);
        return;
      }

      setEditTarget({ type: "booking", id: input.id });
      setIsEditModalOpen(true);
    },
    [availabilities, timeOff, toast],
  );

  const handleSaveAvailabilityEdit = useCallback(async (): Promise<void> => {
    if (!editTarget || editTarget.type !== "availability") {
      return;
    }
    const availability = availabilities.find((a) => a.id === editTarget.id) ?? null;
    if (!availability) {
      setEditModalError("Availability not found.");
      return;
    }
    const startMinutes = getMinutesFromClockTime(availabilityStartClockTime);
    const endMinutes = getMinutesFromClockTime(availabilityEndClockTime);
    if (startMinutes === null || endMinutes === null) {
      setEditModalError("Invalid time format.");
      return;
    }
    if (startMinutes >= endMinutes) {
      setEditModalError("Start time must be before end time.");
      return;
    }
    if (
      !isClockTimeOnThirtyMinuteStep(availabilityStartClockTime) ||
      !isClockTimeOnThirtyMinuteStep(availabilityEndClockTime)
    ) {
      setEditModalError("Time must be in 30-minute increments.");
      return;
    }
    if (endMinutes - startMinutes < AVAILABILITY_MIN_DURATION_MINUTES) {
      setEditModalError("Availability must be at least 1 hour.");
      return;
    }
    const baseDay = dayjs.utc(availability.startTime).startOf("day");
    const [sh, sm] = availabilityStartClockTime.split(":").map((v) => Number(v));
    const [eh, em] = availabilityEndClockTime.split(":").map((v) => Number(v));
    const startLocal = baseDay.hour(sh).minute(sm).second(0).millisecond(0).toDate();
    const endLocal = baseDay.hour(eh).minute(em).second(0).millisecond(0).toDate();
    const startIso = startLocal.toISOString();
    const endIso = endLocal.toISOString();
    if (isInPastOrNow(startIso) || isInPastOrNow(endIso)) {
      setEditModalError("Availability cannot start or end in the past.");
      return;
    }
    if (!isValidTimeRange(startIso, endIso)) {
      setEditModalError("Start time must be before end time.");
      return;
    }
    setEditModalError(null);
    setIsSaving(true);
    try {
      await updateAvailability({
        availabilityId: editTarget.id,
        update: { startTime: startIso, endTime: endIso },
      });
      toast.success("Availability updated");
      setIsEditModalOpen(false);
    } catch (err) {
      setEditModalError(err instanceof Error ? err.message : "Failed to update availability.");
    } finally {
      setIsSaving(false);
    }
  }, [
    availabilityEndClockTime,
    availabilityStartClockTime,
    availabilities,
    editTarget,
    getMinutesFromClockTime,
    isInPastOrNow,
    isValidTimeRange,
    toast,
    updateAvailability,
  ]);

  const handleRequestDeleteAvailability = useCallback((): void => {
    if (!editTarget || editTarget.type !== "availability") {
      return;
    }
    setEditModalError(null);
    setIsDeleteAvailabilityConfirmOpen(true);
  }, [editTarget]);

  const handleConfirmDeleteAvailability = useCallback(async (): Promise<void> => {
    if (!editTarget || editTarget.type !== "availability") {
      setIsDeleteAvailabilityConfirmOpen(false);
      return;
    }
    setEditModalError(null);
    setIsSaving(true);
    try {
      await deleteAvailability({ availabilityId: editTarget.id });
      toast.success("Availability deleted");
      setIsDeleteAvailabilityConfirmOpen(false);
      setIsEditModalOpen(false);
    } catch (err) {
      setIsDeleteAvailabilityConfirmOpen(false);
      setEditModalError(err instanceof Error ? err.message : "Failed to delete availability.");
    } finally {
      setIsSaving(false);
    }
  }, [deleteAvailability, editTarget, toast]);

  const handleSaveTimeOffEdit = useCallback(async (): Promise<void> => {
    if (!editTarget || editTarget.type !== "timeOff") {
      return;
    }
    if (!timeOff.some((t) => t.id === editTarget.id)) {
      setEditModalError("Time off not found.");
      return;
    }
    if (!editTimeOffReason.trim()) {
      setEditModalError("Reason is required.");
      return;
    }
    if (!editTimeOffStartDateTime || !editTimeOffEndDateTime) {
      setEditModalError("Start time and end time are required.");
      return;
    }
    const startIso = getIsoFromDateTimeLocal(editTimeOffStartDateTime);
    const endIso = getIsoFromDateTimeLocal(editTimeOffEndDateTime);
    if (isInPastOrNow(startIso)) {
      setEditModalError("Start time cannot be in the past.");
      return;
    }
    if (isInPastOrNow(endIso)) {
      setEditModalError("End time cannot be in the past.");
      return;
    }
    if (!isValidTimeRange(startIso, endIso)) {
      setEditModalError("Start time must be before end time.");
      return;
    }
    if (
      !isDateTimeLocalOnThirtyMinuteStep(editTimeOffStartDateTime) ||
      !isDateTimeLocalOnThirtyMinuteStep(editTimeOffEndDateTime)
    ) {
      setEditModalError("Time must be in 30-minute increments.");
      return;
    }
    const timeOffStartMs = dayjs
      .utc(editTimeOffStartDateTime, "YYYY-MM-DDTHH:mm", true)
      .valueOf();
    const timeOffEndMs = dayjs
      .utc(editTimeOffEndDateTime, "YYYY-MM-DDTHH:mm", true)
      .valueOf();
    if (
      (timeOffEndMs - timeOffStartMs) / 60000 < TIME_OFF_MIN_DURATION_MINUTES
    ) {
      setEditModalError("Time off must be at least 30 minutes.");
      return;
    }
    setEditModalError(null);
    setIsSaving(true);
    try {
      await updateTimeOff({
        timeOffId: editTarget.id,
        update: {
          reason: editTimeOffReason.trim(),
          startTime: startIso,
          endTime: endIso,
        },
      });
      toast.success("Time off updated");
      setIsEditModalOpen(false);
    } catch (err) {
      setEditModalError(err instanceof Error ? err.message : "Failed to update time off.");
    } finally {
      setIsSaving(false);
    }
  }, [
    editTarget,
    editTimeOffEndDateTime,
    editTimeOffReason,
    editTimeOffStartDateTime,
    getIsoFromDateTimeLocal,
    isInPastOrNow,
    isValidTimeRange,
    timeOff,
    toast,
    updateTimeOff,
  ]);

  const handleRequestDeleteTimeOff = useCallback((): void => {
    if (!editTarget || editTarget.type !== "timeOff") {
      return;
    }
    setEditModalError(null);
    setIsDeleteTimeOffConfirmOpen(true);
  }, [editTarget]);

  const handleConfirmDeleteTimeOff = useCallback(async (): Promise<void> => {
    if (!editTarget || editTarget.type !== "timeOff") {
      setIsDeleteTimeOffConfirmOpen(false);
      return;
    }
    setEditModalError(null);
    setIsSaving(true);
    try {
      await deleteTimeOff({ timeOffId: editTarget.id });
      toast.success("Time off deleted");
      setIsDeleteTimeOffConfirmOpen(false);
      setIsEditModalOpen(false);
    } catch (err) {
      setIsDeleteTimeOffConfirmOpen(false);
      setEditModalError(err instanceof Error ? err.message : "Failed to delete time off.");
    } finally {
      setIsSaving(false);
    }
  }, [deleteTimeOff, editTarget, toast]);

  const handleSaveFromModal = useCallback(async (): Promise<void> => {
    if (createMode === "availability") {
      if (!availabilityWeekStartMonday) {
        setCreateModalError("Select a time range on the calendar again.");
        return;
      }
      if (selectedDays.length === 0) {
        setCreateModalError("Select at least one day.");
        return;
      }
      const startMinutes = getMinutesFromClockTime(availabilityStartClockTime);
      const endMinutes = getMinutesFromClockTime(availabilityEndClockTime);
      if (startMinutes === null || endMinutes === null) {
        setCreateModalError("Invalid time format.");
        return;
      }
      if (startMinutes >= endMinutes) {
        setCreateModalError("Start time must be before end time.");
        return;
      }
      if (
        !isClockTimeOnThirtyMinuteStep(availabilityStartClockTime) ||
        !isClockTimeOnThirtyMinuteStep(availabilityEndClockTime)
      ) {
        setCreateModalError("Time must be in 30-minute increments.");
        return;
      }
      if (endMinutes - startMinutes < AVAILABILITY_MIN_DURATION_MINUTES) {
        setCreateModalError("Availability must be at least 1 hour.");
        return;
      }
      setCreateModalError(null);
      setIsSaving(true);
      try {
        await Promise.all(
          selectedDays.map(async (dayOfWeek) => {
            const startIso = buildIsoForWeekDayAndClockTime(
              availabilityWeekStartMonday,
              dayOfWeek,
              availabilityStartClockTime,
            );
            const endIso = buildIsoForWeekDayAndClockTime(
              availabilityWeekStartMonday,
              dayOfWeek,
              availabilityEndClockTime,
            );
            if (isInPastOrNow(startIso) || isInPastOrNow(endIso)) {
              throw new Error("Availability cannot start or end in the past.");
            }
            if (!isValidTimeRange(startIso, endIso)) {
              throw new Error("Start time must be before end time.");
            }
            const dayDate = addDays(availabilityWeekStartMonday, dayOfWeek - 1);
            const resolvedDayOfWeek = getIsoDayOfWeek(dayDate);
            await createAvailability({
              dayOfWeek: resolvedDayOfWeek,
              startTime: startIso,
              endTime: endIso,
            });
          }),
        );
        toast.success("Availability added");
        setIsCreateModalOpen(false);
        setAvailabilityWeekStartMonday(null);
      } catch (err) {
        setCreateModalError(err instanceof Error ? err.message : "Failed to add availability.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!timeOffReason.trim()) {
      setCreateModalError("Reason is required.");
      return;
    }
    if (!timeOffStartDateTime || !timeOffEndDateTime) {
      setCreateModalError("Start time and end time are required.");
      return;
    }
    const startIso = getIsoFromDateTimeLocal(timeOffStartDateTime);
    const endIso = getIsoFromDateTimeLocal(timeOffEndDateTime);
    if (isInPastOrNow(startIso)) {
      setCreateModalError("Start time cannot be in the past.");
      return;
    }
    if (isInPastOrNow(endIso)) {
      setCreateModalError("End time cannot be in the past.");
      return;
    }
    if (!isValidTimeRange(startIso, endIso)) {
      setCreateModalError("Start time must be before end time.");
      return;
    }
    if (
      !isDateTimeLocalOnThirtyMinuteStep(timeOffStartDateTime) ||
      !isDateTimeLocalOnThirtyMinuteStep(timeOffEndDateTime)
    ) {
      setCreateModalError("Time must be in 30-minute increments.");
      return;
    }
    const timeOffStartMs = dayjs
      .utc(timeOffStartDateTime, "YYYY-MM-DDTHH:mm", true)
      .valueOf();
    const timeOffEndMs = dayjs
      .utc(timeOffEndDateTime, "YYYY-MM-DDTHH:mm", true)
      .valueOf();
    if (
      (timeOffEndMs - timeOffStartMs) / 60000 < TIME_OFF_MIN_DURATION_MINUTES
    ) {
      setCreateModalError("Time off must be at least 30 minutes.");
      return;
    }
    const payload: CreateTrainerTimeOffInput = {
      reason: timeOffReason.trim(),
      startTime: startIso,
      endTime: endIso,
    };
    setCreateModalError(null);
    setIsSaving(true);
    try {
      await createTimeOff(payload);
      toast.success("Time off added");
      setIsCreateModalOpen(false);
      setAvailabilityWeekStartMonday(null);
    } catch (err) {
      setCreateModalError(err instanceof Error ? err.message : "Failed to add time off.");
    } finally {
      setIsSaving(false);
    }
  }, [
    availabilityEndClockTime,
    availabilityStartClockTime,
    availabilityWeekStartMonday,
    createAvailability,
    createMode,
    createTimeOff,
    getIsoFromDateTimeLocal,
    getMinutesFromClockTime,
    isInPastOrNow,
    isValidTimeRange,
    selectedDays,
    timeOffEndDateTime,
    timeOffReason,
    timeOffStartDateTime,
    toast,
  ]);

  if (isLoading) {
    return (
      <div
        className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
        aria-label="Loading schedule"
      />
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
        aria-label="Failed to load schedule"
      >
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Could not load your profile. Please refresh and try again.
        </div>
      </div>
    );
  }

  if (!isTrainer) {
    return (
      <div
        className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
        aria-label="Schedule permission required"
      >
        <div className="text-base font-semibold">No permission</div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Schedule is only available for Trainer accounts.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-label="Trainer schedule">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Week calendar
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Click + drag to select a time range, then save as Availability or Time off. Availability is at
            least 1 hour; time off is at least 30 minutes. Times use 30-minute increments.
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsCalendarVisible((prev) => !prev)}
          aria-label={isCalendarVisible ? "Hide week calendar" : "Show week calendar"}
        >
          {isCalendarVisible ? "Hide week calendar" : "Show week calendar"}
        </Button>
      </div>

      {isCalendarVisible && (
        <WeeklyScheduleCalendar
          availabilities={availabilities}
          timeOff={timeOff}
          bookings={bookings}
          onCreateSelection={openCreateModalFromSelection}
          onEventClick={openEditModalFromEvent}
        />
      )}

      <section
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
        aria-label="Schedule summary"
      >
        <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Schedule summary
        </div>
        {isScheduleLoading && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
            Updating list…
          </p>
        )}
        {scheduleError && (
          <p className="mt-3 text-sm text-error-600 dark:text-error-500" role="alert">
            {scheduleError.message}
          </p>
        )}
        <div
          className="mt-5 max-h-[min(50vh,26rem)] overflow-y-auto overscroll-y-contain rounded-lg pr-1 no-scrollbar outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 sm:pr-2"
          role="region"
          aria-label="Scrollable schedule summary lists"
          tabIndex={0}
        >
          <div className="grid gap-8 pb-1 lg:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Availability
                <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                  ({sortedAvailabilities.length})
                </span>
              </div>
              {sortedAvailabilities.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No availability windows yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2" aria-label="Availability list">
                  {sortedAvailabilities.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90"
                    >
                      <div className="font-medium">{formatDayOfWeek(item.dayOfWeek)}</div>
                      <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {formatTimeFromIso(item.startTime)} – {formatTimeFromIso(item.endTime)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Time off
                <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                  ({sortedTimeOff.length})
                </span>
              </div>
              {sortedTimeOff.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No time off scheduled yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2" aria-label="Time off list">
                  {sortedTimeOff.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90"
                    >
                      <div className="font-medium">{item.reason}</div>
                      <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {formatDateTimeFromIso(item.startTime)} →{" "}
                        {formatDateTimeFromIso(item.endTime)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalError(null);
          setAvailabilityWeekStartMonday(null);
        }}
        className="mx-4 w-full max-w-2xl p-5 sm:p-6"
      >
        <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Add to schedule
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-2">
            Type
            <select
              value={createMode}
              onChange={(e) => {
                setCreateModalError(null);
                setCreateMode(e.target.value as "availability" | "timeOff");
              }}
              className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              aria-label="Select schedule item type"
            >
              <option value="availability">Availability</option>
              <option value="timeOff">Time off</option>
            </select>
          </label>

          {createMode === "availability" && (
            <>
              <div className="sm:col-span-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Days
                </div>
                <div
                  className="mt-2 grid grid-cols-4 gap-2"
                  role="group"
                  aria-label="Select availability days"
                >
                  {DAY_OPTIONS.map((d) => {
                    const isSelected = selectedDays.includes(d.dayOfWeek);
                    return (
                      <label
                        key={d.dayOfWeek}
                        className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 ${
                          isSelected
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/80 dark:hover:bg-gray-900"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setCreateModalError(null);
                            setSelectedDays((prev) => {
                              if (prev.includes(d.dayOfWeek)) {
                                return prev.filter((x) => x !== d.dayOfWeek);
                              }
                              return [...prev, d.dayOfWeek].sort((a, b) => a - b);
                            });
                          }}
                          className="sr-only"
                          aria-label={`Toggle ${d.label}`}
                        />
                        {d.label}
                      </label>
                    );
                  })}
                </div>
                {selectedDays.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Selected:{" "}
                    <span className="font-medium text-gray-700 dark:text-white/80">
                      {selectedDays.map(formatDayOfWeek).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Start time
                <input
                  value={availabilityStartClockTime}
                  onChange={(e) => {
                    setCreateModalError(null);
                    setAvailabilityStartClockTime(e.target.value);
                  }}
                  type="time"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Availability start time"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                End time
                <input
                  value={availabilityEndClockTime}
                  onChange={(e) => {
                    setCreateModalError(null);
                    setAvailabilityEndClockTime(e.target.value);
                  }}
                  type="time"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Availability end time"
                />
              </label>
            </>
          )}

          {createMode === "timeOff" && (
            <>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-2">
                Reason
                <input
                  value={timeOffReason}
                  onChange={(e) => {
                    setCreateModalError(null);
                    setTimeOffReason(e.target.value);
                  }}
                  type="text"
                  placeholder="e.g. personal"
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Time off reason"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Start
                <input
                  value={timeOffStartDateTime}
                  onChange={(e) => {
                    setCreateModalError(null);
                    setTimeOffStartDateTime(e.target.value);
                  }}
                  type="datetime-local"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Time off start time"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                End
                <input
                  value={timeOffEndDateTime}
                  onChange={(e) => {
                    setCreateModalError(null);
                    setTimeOffEndDateTime(e.target.value);
                  }}
                  type="datetime-local"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Time off end time"
                />
              </label>
            </>
          )}
        </div>

        {createModalError && (
          <div
            className="mt-4 text-sm text-error-600 dark:text-error-500"
            role="alert"
            aria-live="polite"
          >
            {createModalError}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreateModalOpen(false);
              setCreateModalError(null);
              setAvailabilityWeekStartMonday(null);
            }}
            aria-label="Cancel adding to schedule"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveFromModal}
            disabled={isSaving}
            aria-label="Save schedule item"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        {isScheduleLoading && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Refreshing schedule...
          </div>
        )}
        {scheduleError && (
          <div className="mt-4 rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
            <p className="text-sm text-error-600 dark:text-error-500">
              {scheduleError.message}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditModalError(null);
          setIsDeleteAvailabilityConfirmOpen(false);
          setIsDeleteTimeOffConfirmOpen(false);
        }}
        className="mx-4 w-full max-w-2xl p-5 sm:p-6"
      >
        <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {editTarget?.type === "availability"
            ? "Edit availability"
            : editTarget?.type === "timeOff"
              ? "Edit time off"
              : "Booking"}
        </div>

        {editTarget?.type === "availability" && (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Day
                </div>
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90">
                  {editingAvailabilityDayLabel}
                </div>
              </div>

              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Start time
                <input
                  value={availabilityStartClockTime}
                  onChange={(e) => {
                    setEditModalError(null);
                    setAvailabilityStartClockTime(e.target.value);
                  }}
                  type="time"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Edit availability start time"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                End time
                <input
                  value={availabilityEndClockTime}
                  onChange={(e) => {
                    setEditModalError(null);
                    setAvailabilityEndClockTime(e.target.value);
                  }}
                  type="time"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Edit availability end time"
                />
              </label>
            </div>

            {editModalError && (
              <div
                className="mt-4 text-sm text-error-600 dark:text-error-500"
                role="alert"
                aria-live="polite"
              >
                {editModalError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={handleRequestDeleteAvailability}
                disabled={isSaving}
                aria-label="Delete availability"
                className="text-error-600 dark:text-error-500"
              >
                Delete
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditModalError(null);
                    setIsDeleteAvailabilityConfirmOpen(false);
                  }}
                  aria-label="Cancel editing"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAvailabilityEdit}
                  disabled={isSaving}
                  aria-label="Save availability"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </>
        )}

        {editTarget?.type === "timeOff" && (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Reason
                <input
                  value={editTimeOffReason}
                  onChange={(e) => {
                    setEditModalError(null);
                    setEditTimeOffReason(e.target.value);
                  }}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Edit time off reason"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Start
                <input
                  value={editTimeOffStartDateTime}
                  onChange={(e) => {
                    setEditModalError(null);
                    setEditTimeOffStartDateTime(e.target.value);
                  }}
                  type="datetime-local"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Edit time off start time"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                End
                <input
                  value={editTimeOffEndDateTime}
                  onChange={(e) => {
                    setEditModalError(null);
                    setEditTimeOffEndDateTime(e.target.value);
                  }}
                  type="datetime-local"
                  step={SCHEDULE_TIME_INPUT_STEP_SECONDS}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Edit time off end time"
                />
              </label>
            </div>

            {editModalError && (
              <div
                className="mt-4 text-sm text-error-600 dark:text-error-500"
                role="alert"
                aria-live="polite"
              >
                {editModalError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={handleRequestDeleteTimeOff}
                disabled={isSaving}
                aria-label="Delete time off"
                className="text-error-600 dark:text-error-500"
              >
                Delete
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditModalError(null);
                    setIsDeleteTimeOffConfirmOpen(false);
                  }}
                  aria-label="Cancel editing time off"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSaveTimeOffEdit()}
                  disabled={isSaving}
                  aria-label="Save time off"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </>
        )}

        {editTarget?.type === "booking" && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Bookings are managed from the Bookings page.
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteAvailabilityConfirmOpen}
        onClose={() => setIsDeleteAvailabilityConfirmOpen(false)}
        onConfirm={() => void handleConfirmDeleteAvailability()}
        title="Delete availability"
        message="This will remove this availability slot. You can add a new one from the calendar anytime."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isConfirming={isSaving}
      />

      <ConfirmModal
        isOpen={isDeleteTimeOffConfirmOpen}
        onClose={() => setIsDeleteTimeOffConfirmOpen(false)}
        onConfirm={() => void handleConfirmDeleteTimeOff()}
        title="Delete time off"
        message="This will remove this time off block from your schedule."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isConfirming={isSaving}
      />
    </div>
  );
};

export default ScheduleContent;

