"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { User } from "@/types/user.types";
import { createBooking } from "@/services/bookings/bookings.service";
import { getUsers } from "@/services/users/users.service";
import type {
  AvailableSlot,
} from "@/services/booking-discovery/booking-discovery.service";
import {
  getAvailableSlots,
  getAvailableTrainers,
} from "@/services/booking-discovery/booking-discovery.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import UserCard from "./UserCard";

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: User | null;
  onSuccess: () => void;
}

const DATETIME_LOCAL_FORMAT = "YYYY-MM-DDTHH:mm";
const DATE_LOCAL_FORMAT = "YYYY-MM-DD";
const MIN_DURATION_MINUTES = 60;
const STEP_MINUTES = 30;
const TIME_LOCAL_FORMAT = "HH:mm";
const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH_APPROX = 30;
const DAYS_IN_YEAR_APPROX = 365;

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

function getDefaultDate(): string {
  return dayjs().format(DATE_LOCAL_FORMAT);
}

function getDefaultWeek(): string {
  return dayjs().format("GGGG-[W]WW");
}

function getDefaultMonth(): string {
  return dayjs().format("YYYY-MM");
}

function getDefaultYear(): string {
  return dayjs().format("YYYY");
}

function formatDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateRangeLabel(input: { startIso: string; endIso: string }): string {
  const start = new Date(input.startIso);
  const end = new Date(input.endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const startLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} → ${endLabel}`;
}

function combineDateAndTimeToIso(input: {
  dateLocal: string;
  timeLocal: string;
}): string | null {
  const dateParts = input.dateLocal.split("-").map((v) => Number(v));
  if (dateParts.length !== 3) return null;
  const [year, month1, day] = dateParts;
  if (!Number.isFinite(year) || !Number.isFinite(month1) || !Number.isFinite(day)) return null;
  if (month1 < 1 || month1 > 12) return null;
  if (day < 1 || day > 31) return null;
  if (!/^\d{2}:\d{2}$/.test(input.timeLocal)) return null;
  const [h, m] = input.timeLocal.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23) return null;
  if (m < 0 || m > 59) return null;
  const local = new Date(year, month1 - 1, day, h, m, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

function updateDatePartOfDateTimeLocal(input: {
  dateLocal: string;
  dateTimeLocal: string;
}): string {
  const date = dayjs(input.dateLocal, DATE_LOCAL_FORMAT, true);
  const dt = dayjs(input.dateTimeLocal);
  if (!date.isValid() || !dt.isValid()) return input.dateTimeLocal;
  const next = dt.year(date.year()).month(date.month()).date(date.date());
  return next.format(DATETIME_LOCAL_FORMAT);
}

function isOnThirtyMinuteStep(value: string): boolean {
  const d = dayjs(value);
  if (!d.isValid()) return false;
  return d.second() === 0 && d.millisecond() === 0 && d.minute() % STEP_MINUTES === 0;
}

function isValidMinDuration(startIso: string, endIso: string): boolean {
  const start = dayjs(startIso);
  const end = dayjs(endIso);
  if (!start.isValid() || !end.isValid()) return false;
  return end.diff(start, "minute") >= MIN_DURATION_MINUTES;
}

type BookingMode = "trainerFirst" | "timeFirst";
type TimeFirstPeriod = "day" | "week" | "month" | "year";

export default function CreateBookingModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
}: CreateBookingModalProps) {
  const [mode, setMode] = useState<BookingMode | null>(null);
  const [timeFirstPeriod, setTimeFirstPeriod] = useState<TimeFirstPeriod>("day");

  const [selectedTrainer, setSelectedTrainer] = useState<User | null>(trainer);

  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime);
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const [startClockTime, setStartClockTime] = useState<string>(
    dayjs(getDefaultStartTime()).format(TIME_LOCAL_FORMAT),
  );
  const [endClockTime, setEndClockTime] = useState<string>(
    dayjs(getDefaultEndTime()).format(TIME_LOCAL_FORMAT),
  );
  const [selectedWeek, setSelectedWeek] = useState(getDefaultWeek);
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth);
  const [selectedYear, setSelectedYear] = useState(getDefaultYear);

  const [trainerList, setTrainerList] = useState<User[]>([]);
  const [availableTrainerList, setAvailableTrainerList] = useState<User[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const resolvedMode = useMemo<BookingMode | null>(() => {
    if (trainer) return "trainerFirst";
    return mode;
  }, [mode, trainer]);

  useEffect(() => {
    if (!isOpen) return;
    if (trainer) {
      setSelectedTrainer(trainer);
      setMode("trainerFirst");
    }
  }, [isOpen, trainer]);

  useEffect(() => {
    if (!isOpen) return;
    if (trainerList.length > 0) return;
    setIsLoadingTrainers(true);
    setError(null);
    getUsers({ role: "TRAINER", approvalStatus: "APPROVED", limit: 200 })
      .then((res) => setTrainerList(res.users))
      .catch((err) => {
        setTrainerList([]);
        setError(getErrorMessage(err, "Failed to load trainers"));
      })
      .finally(() => setIsLoadingTrainers(false));
  }, [isOpen, trainerList.length]);

  const handleClose = () => {
    setMode(null);
    setTimeFirstPeriod("day");
    setSelectedTrainer(trainer ?? null);
    setStartTime(getDefaultStartTime());
    setEndTime(getDefaultEndTime());
    setSelectedDate(getDefaultDate());
    setStartClockTime(dayjs(getDefaultStartTime()).format(TIME_LOCAL_FORMAT));
    setEndClockTime(dayjs(getDefaultEndTime()).format(TIME_LOCAL_FORMAT));
    setSelectedWeek(getDefaultWeek());
    setSelectedMonth(getDefaultMonth());
    setSelectedYear(getDefaultYear());
    setAvailableTrainerList([]);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setError(null);
    onClose();
  };

  const handleSubmitDirect = async (input: {
    trainerId: string;
    startTimeIso: string;
    endTimeIso: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createBooking({
        trainerId: input.trainerId,
        startTime: input.startTimeIso,
        endTime: input.endTimeIso,
      });
      toast.success("Booking created successfully");
      onSuccess();
      handleClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create booking");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindAvailableTrainers = async () => {
    const startIso =
      combineDateAndTimeToIso({ dateLocal: selectedDate, timeLocal: startClockTime }) ??
      dayjs(startTime).toISOString();
    const endIso =
      combineDateAndTimeToIso({ dateLocal: selectedDate, timeLocal: endClockTime }) ??
      dayjs(endTime).toISOString();
    if (!isOnThirtyMinuteStep(startIso) || !isOnThirtyMinuteStep(endIso)) {
      setError("Time must be in 30-minute increments.");
      return;
    }
    if (!isValidMinDuration(startIso, endIso)) {
      setError("Duration must be at least 1 hour.");
      return;
    }
    setIsLoadingAvailability(true);
    setError(null);
    setAvailableTrainerList([]);
    setSelectedTrainer(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    try {
      const trainers = await getAvailableTrainers({ startTime: startIso, endTime: endIso });
      setAvailableTrainerList(trainers);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load available trainers"));
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleFindAvailableSlots = async (input: { trainerId: string; rangeStart: string; rangeEnd: string }) => {
    setIsLoadingAvailability(true);
    setError(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    try {
      const slots = await getAvailableSlots({
        trainerId: input.trainerId,
        rangeStart: input.rangeStart,
        rangeEnd: input.rangeEnd,
        durationMinutes: 60,
        stepMinutes: 30,
      });
      setAvailableSlots(slots);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load available slots"));
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const displayName = getDisplayName(selectedTrainer);

  const rangeForSelectedDate = useMemo(() => {
    const start = dayjs(selectedDate).startOf("day");
    const end = start.add(1, "day");
    return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
  }, [selectedDate]);

  const rangeForTimeFirstPeriod = useMemo(() => {
    if (timeFirstPeriod === "day") {
      const start = dayjs(selectedDate).startOf("day");
      const end = start.add(1, "day");
      return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
    }
    if (timeFirstPeriod === "week") {
      const start = dayjs(selectedWeek, "GGGG-[W]WW", true).startOf("week");
      const end = start.add(DAYS_IN_WEEK, "day");
      return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
    }
    if (timeFirstPeriod === "month") {
      const start = dayjs(selectedMonth, "YYYY-MM", true).startOf("month");
      const end = start.add(DAYS_IN_MONTH_APPROX, "day");
      return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
    }
    const start = dayjs(selectedYear, "YYYY", true).startOf("year");
    const end = start.add(DAYS_IN_YEAR_APPROX, "day");
    return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
  }, [selectedDate, selectedMonth, selectedWeek, selectedYear, timeFirstPeriod]);

  const timeFirstAnchorLabel = useMemo(() => {
    if (timeFirstPeriod === "day") {
      const d = dayjs(selectedDate, DATE_LOCAL_FORMAT, true);
      return d.isValid() ? d.format("ddd, MMM D, YYYY") : "—";
    }
    if (timeFirstPeriod === "week") {
      return formatDateRangeLabel({
        startIso: rangeForTimeFirstPeriod.rangeStartIso,
        endIso: rangeForTimeFirstPeriod.rangeEndIso,
      });
    }
    if (timeFirstPeriod === "month") {
      const d = dayjs(selectedMonth, "YYYY-MM", true);
      return d.isValid() ? d.format("MMMM YYYY") : "—";
    }
    return selectedYear;
  }, [
    rangeForTimeFirstPeriod.rangeEndIso,
    rangeForTimeFirstPeriod.rangeStartIso,
    selectedDate,
    selectedMonth,
    selectedYear,
    timeFirstPeriod,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="mx-4 w-full max-w-3xl p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Create booking
      </h3>

      {trainer ? (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Booking with{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {getDisplayName(trainer)}
          </span>
        </p>
      ) : resolvedMode === null ? (
        <div className="mb-6">
          <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Choose how you want to start.
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("timeFirst")}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-900 dark:focus:ring-offset-gray-900"
              aria-label="Start by selecting expected time"
            >
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Select expected time first
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Pick time → show available trainers
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("trainerFirst")}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-900 dark:focus:ring-offset-gray-900"
              aria-label="Start by selecting trainer"
            >
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Select trainer first
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Pick trainer → select time
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mode:{" "}
            <span className="font-medium text-gray-800 dark:text-white/80">
              {resolvedMode === "timeFirst" ? "Expected time first" : "Trainer first"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode(null);
              setSelectedTrainer(null);
              setAvailableTrainerList([]);
              setAvailableSlots([]);
              setSelectedSlot(null);
              setError(null);
            }}
            aria-label="Change booking mode"
          >
            Change
          </Button>
        </div>
      )}

      {!trainer && resolvedMode === null ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Step 1
            </div>

              {resolvedMode === "trainerFirst" ? (
              <>
                <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trainer
                </div>
                {selectedTrainer ? (
                  <div className="mt-2">
                    <UserCard user={selectedTrainer} />
                    {!trainer && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSelectedTrainer(null);
                          setAvailableSlots([]);
                          setSelectedSlot(null);
                        }}
                        aria-label="Change selected trainer"
                      >
                        Change trainer
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {isLoadingTrainers ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading trainers…</div>
                    ) : trainerList.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No trainers found.</div>
                    ) : (
                      <ul className="max-h-[18rem] space-y-2 overflow-y-auto pr-1 no-scrollbar" role="list" tabIndex={0}>
                        {trainerList.map((t) => (
                          <li key={t.id}>
                            <UserCard
                              user={t}
                              onClick={() => {
                                setSelectedTrainer(t);
                                setAvailableSlots([]);
                                setSelectedSlot(null);
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setSelectedDate(nextDate);
                    setStartTime((prev) =>
                      updateDatePartOfDateTimeLocal({
                        dateLocal: nextDate,
                        dateTimeLocal: prev,
                      }),
                    );
                    setEndTime((prev) =>
                      updateDatePartOfDateTimeLocal({
                        dateLocal: nextDate,
                        dateTimeLocal: prev,
                      }),
                    );
                  }}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Select date"
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {dayjs(selectedDate, DATE_LOCAL_FORMAT, true).isValid()
                    ? dayjs(selectedDate, DATE_LOCAL_FORMAT, true).format("ddd, MMM D, YYYY")
                    : "—"}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!selectedTrainer) {
                        setError("Please select a trainer first.");
                        return;
                      }
                      void handleFindAvailableSlots({
                        trainerId: selectedTrainer.id,
                        rangeStart: rangeForSelectedDate.rangeStartIso,
                        rangeEnd: rangeForSelectedDate.rangeEndIso,
                      });
                    }}
                    disabled={isLoadingAvailability}
                    aria-label="Find available time slots for selected trainer"
                  >
                    {isLoadingAvailability ? "Finding…" : "Find available times"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Period
                </div>
                <select
                  value={timeFirstPeriod}
                  onChange={(e) => {
                    setTimeFirstPeriod(e.target.value as TimeFirstPeriod);
                    setAvailableTrainerList([]);
                    setSelectedTrainer(null);
                    setAvailableSlots([]);
                    setSelectedSlot(null);
                    setError(null);
                  }}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Select period"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>

                <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {timeFirstPeriod === "day"
                    ? "Date"
                    : timeFirstPeriod === "week"
                      ? "Week"
                      : timeFirstPeriod === "month"
                        ? "Month"
                        : "Year"}
                </div>
                {timeFirstPeriod === "day" && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setSelectedDate(nextDate);
                      setStartTime((prev) =>
                        updateDatePartOfDateTimeLocal({
                          dateLocal: nextDate,
                          dateTimeLocal: prev,
                        }),
                      );
                      setEndTime((prev) =>
                        updateDatePartOfDateTimeLocal({
                          dateLocal: nextDate,
                          dateTimeLocal: prev,
                        }),
                      );
                    }}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    aria-label="Select date"
                  />
                )}
                {timeFirstPeriod === "week" && (
                  <input
                    type="week"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    aria-label="Select week"
                  />
                )}
                {timeFirstPeriod === "month" && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    aria-label="Select month"
                  />
                )}
                {timeFirstPeriod === "year" && (
                  <input
                    inputMode="numeric"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    aria-label="Select year"
                    placeholder={getDefaultYear()}
                  />
                )}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {timeFirstAnchorLabel}
                </div>

                {timeFirstPeriod === "day" ? (
                  <>
                    <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expected time range
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="start-clock-time"
                          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Start time
                        </label>
                        <input
                          id="start-clock-time"
                          type="time"
                          value={startClockTime}
                          onChange={(e) => setStartClockTime(e.target.value)}
                          step={STEP_MINUTES * 60}
                          className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                          required
                          aria-label="Session start time"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="end-clock-time"
                          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          End time
                        </label>
                        <input
                          id="end-clock-time"
                          type="time"
                          value={endClockTime}
                          onChange={(e) => setEndClockTime(e.target.value)}
                          step={STEP_MINUTES * 60}
                          className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                          required
                          aria-label="Session end time"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleFindAvailableTrainers()}
                        disabled={isLoadingAvailability}
                        aria-label="Find trainers available for selected time range"
                      >
                        {isLoadingAvailability ? "Finding…" : "Find available trainers"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Step 2 will be: choose trainer → then choose an available 60-minute slot within the selected period.
                    </div>
                    <div className="mt-3 space-y-2">
                      {isLoadingTrainers ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Loading trainers…</div>
                      ) : trainerList.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No trainers found.</div>
                      ) : (
                        <ul className="max-h-[18rem] space-y-2 overflow-y-auto pr-1 no-scrollbar" role="list" tabIndex={0}>
                          {trainerList.map((t) => (
                            <li key={t.id}>
                              <UserCard
                                user={t}
                                onClick={() => {
                                  setSelectedTrainer(t);
                                  setAvailableSlots([]);
                                  setSelectedSlot(null);
                                  void handleFindAvailableSlots({
                                    trainerId: t.id,
                                    rangeStart: rangeForTimeFirstPeriod.rangeStartIso,
                                    rangeEnd: rangeForTimeFirstPeriod.rangeEndIso,
                                  });
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Step 2
            </div>

            {resolvedMode === "timeFirst" && timeFirstPeriod === "day" ? (
              <>
                <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available trainers
                </div>
                {isLoadingAvailability ? (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                ) : availableTrainerList.length === 0 ? (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Search for available trainers to see results.
                  </div>
                ) : (
                  <ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto pr-1 no-scrollbar" role="list" tabIndex={0}>
                    {availableTrainerList.map((t) => (
                      <li key={t.id}>
                        <UserCard
                          user={t}
                          onClick={() => {
                            setSelectedTrainer(t);
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available time slots
                </div>
                {isLoadingAvailability ? (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                ) : availableSlots.length === 0 ? (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Pick a trainer and search to see available slots.
                  </div>
                ) : (
                  <ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto pr-1 no-scrollbar" role="list" tabIndex={0}>
                    {availableSlots.map((s) => {
                      const isSelected =
                        selectedSlot?.startTime === s.startTime && selectedSlot?.endTime === s.endTime;
                      const label = `${new Date(s.startTime).toLocaleString()} → ${new Date(
                        s.endTime,
                      ).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
                      return (
                        <li key={`${s.startTime}-${s.endTime}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                              isSelected
                                ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
                                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-white/[0.04]"
                            }`}
                            aria-label={`Select slot ${label}`}
                          >
                            <div className="font-medium">{label}</div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Confirm
            </div>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {selectedTrainer ? (
                <>
                  Trainer: <span className="font-medium text-gray-700 dark:text-gray-300">{displayName}</span>
                </>
              ) : (
                <>Trainer: —</>
              )}
            </div>

            {resolvedMode === "timeFirst" && timeFirstPeriod === "day" ? (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Time:{" "}
                {combineDateAndTimeToIso({ dateLocal: selectedDate, timeLocal: startClockTime }) &&
                combineDateAndTimeToIso({ dateLocal: selectedDate, timeLocal: endClockTime }) ? (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDateTimeLocal(
                      combineDateAndTimeToIso({
                        dateLocal: selectedDate,
                        timeLocal: startClockTime,
                      }) ?? "",
                    )}{" "}
                    →{" "}
                    {formatDateTimeLocal(
                      combineDateAndTimeToIso({
                        dateLocal: selectedDate,
                        timeLocal: endClockTime,
                      }) ?? "",
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Time:{" "}
                {selectedSlot ? (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDateTimeLocal(selectedSlot.startTime)} →{" "}
                    {formatDateTimeLocal(selectedSlot.endTime)}
                  </span>
                ) : (
                  "—"
                )}
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-error-600 dark:text-error-500" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Cancel booking"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={() => {
                  if (!selectedTrainer) {
                    setError("Please select a trainer.");
                    return;
                  }
                  if (resolvedMode === "timeFirst" && timeFirstPeriod === "day") {
                    const startIso = combineDateAndTimeToIso({
                      dateLocal: selectedDate,
                      timeLocal: startClockTime,
                    });
                    const endIso = combineDateAndTimeToIso({
                      dateLocal: selectedDate,
                      timeLocal: endClockTime,
                    });
                    if (!startIso || !endIso) {
                      setError("Please select start and end time.");
                      return;
                    }
                    if (!isOnThirtyMinuteStep(startIso) || !isOnThirtyMinuteStep(endIso)) {
                      setError("Time must be in 30-minute increments.");
                      return;
                    }
                    if (!isValidMinDuration(startIso, endIso)) {
                      setError("Duration must be at least 1 hour.");
                      return;
                    }
                    void handleSubmitDirect({
                      trainerId: selectedTrainer.id,
                      startTimeIso: startIso,
                      endTimeIso: endIso,
                    });
                    return;
                  }
                  if (!selectedSlot) {
                    setError("Please select a time slot.");
                    return;
                  }
                  void handleSubmitDirect({
                    trainerId: selectedTrainer.id,
                    startTimeIso: selectedSlot.startTime,
                    endTimeIso: selectedSlot.endTime,
                  });
                }}
                aria-label="Confirm booking"
              >
                {isSubmitting ? "Booking..." : "Book"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
