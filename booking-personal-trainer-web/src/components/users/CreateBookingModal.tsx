"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatDateRangeLabelUtc,
  formatInstantUtc,
} from "@/lib/date-time/utc-date-time.helper";
import dayjs from "@/lib/date-time/utc-dayjs";
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

const getDisplayName = (user: User | null) => {
  if (!user) return "";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
};

/** Earliest start: now + 30 min, rounded up to next 30-min slot (matches BE MUST_BOOK_BEFORE_30_MINUTES) */
function getEarliestStartTime(): dayjs.Dayjs {
  const base = dayjs.utc().add(30, "minute");
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
  return dayjs.utc().format(DATE_LOCAL_FORMAT);
}

function getDefaultWeek(): string {
  return dayjs.utc().format("GGGG-[W]WW");
}

function formatDateTimeLocal(iso: string): string {
  if (!dayjs.utc(iso).isValid()) return "—";
  return formatInstantUtc(iso, "ddd, D MMM YYYY, HH:mm");
}

function formatDateRangeLabel(input: { startIso: string; endIso: string }): string {
  return formatDateRangeLabelUtc(input.startIso, input.endIso);
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
  const combined = dayjs.utc(
    `${String(year)}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    "YYYY-MM-DD HH:mm",
    true,
  );
  if (!combined.isValid()) return null;
  return combined.toISOString();
}

function updateDatePartOfDateTimeLocal(input: {
  dateLocal: string;
  dateTimeLocal: string;
}): string {
  const date = dayjs.utc(input.dateLocal, DATE_LOCAL_FORMAT, true);
  const dt = dayjs.utc(input.dateTimeLocal, DATETIME_LOCAL_FORMAT, true);
  if (!date.isValid() || !dt.isValid()) return input.dateTimeLocal;
  const next = dt.year(date.year()).month(date.month()).date(date.date());
  return next.format(DATETIME_LOCAL_FORMAT);
}

function isOnThirtyMinuteStep(value: string): boolean {
  const isDateTimeLocalNaive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
  const d = isDateTimeLocalNaive
    ? dayjs.utc(value, DATETIME_LOCAL_FORMAT, true)
    : dayjs.utc(value);
  if (!d.isValid()) return false;
  return d.second() === 0 && d.millisecond() === 0 && d.minute() % STEP_MINUTES === 0;
}

function isValidMinDuration(startIso: string, endIso: string): boolean {
  const start = dayjs.utc(startIso);
  const end = dayjs.utc(endIso);
  if (!start.isValid() || !end.isValid()) return false;
  return end.diff(start, "minute") >= MIN_DURATION_MINUTES;
}

function isValidClockTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function clockTimeToMinutes(value: string): number | null {
  if (!isValidClockTime(value)) return null;
  const [h, m] = value.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23) return null;
  if (m < 0 || m > 59) return null;
  return h * 60 + m;
}

function getClockTimeOptions(): readonly string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += STEP_MINUTES) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return options;
}

type BookingMode = "trainerFirst" | "timeFirst";
type TimeFirstPeriod = "day" | "week";
type WeekDaySlot = { startClockTime: string; endClockTime: string };
type WeekDaySlotMap = Record<string, WeekDaySlot>;

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
    dayjs.utc(getDefaultStartTime(), DATETIME_LOCAL_FORMAT, true).format(TIME_LOCAL_FORMAT),
  );
  const [endClockTime, setEndClockTime] = useState<string>(
    dayjs.utc(getDefaultEndTime(), DATETIME_LOCAL_FORMAT, true).format(TIME_LOCAL_FORMAT),
  );
  const [selectedWeek, setSelectedWeek] = useState(getDefaultWeek);
  const [weekDaySlots, setWeekDaySlots] = useState<WeekDaySlotMap>({});

  const [trainerList, setTrainerList] = useState<User[]>([]);
  const [availableTrainerList, setAvailableTrainerList] = useState<User[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const clockTimeOptions = useMemo(() => getClockTimeOptions(), []);

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
    setStartClockTime(dayjs.utc(getDefaultStartTime(), DATETIME_LOCAL_FORMAT, true).format(TIME_LOCAL_FORMAT));
    setEndClockTime(dayjs.utc(getDefaultEndTime(), DATETIME_LOCAL_FORMAT, true).format(TIME_LOCAL_FORMAT));
    setSelectedWeek(getDefaultWeek());
    setWeekDaySlots({});
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
      dayjs.utc(startTime, DATETIME_LOCAL_FORMAT, true).toISOString();
    const endIso =
      combineDateAndTimeToIso({ dateLocal: selectedDate, timeLocal: endClockTime }) ??
      dayjs.utc(endTime, DATETIME_LOCAL_FORMAT, true).toISOString();
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
    const start = dayjs.utc(selectedDate, DATE_LOCAL_FORMAT, true).startOf("day");
    const end = start.add(1, "day");
    if (!start.isValid() || !end.isValid()) return { rangeStartIso: "", rangeEndIso: "" };
    return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
  }, [selectedDate]);

  const timeFirstWeekStart = useMemo(() => {
    const start = dayjs.utc(selectedWeek, "GGGG-[W]WW", true).startOf("isoWeek");
    return start.isValid() ? start : null;
  }, [selectedWeek]);

  const weekDates = useMemo(() => {
    if (!timeFirstWeekStart) return [];
    return Array.from({ length: DAYS_IN_WEEK }).map((_, i) => {
      const d = timeFirstWeekStart.add(i, "day");
      return {
        dateLocal: d.format(DATE_LOCAL_FORMAT),
        label: d.format("ddd, MMM D"),
      };
    });
  }, [timeFirstWeekStart]);

  const rangeForTimeFirstPeriod = useMemo(() => {
    if (timeFirstPeriod === "day") {
      const start = dayjs.utc(selectedDate, DATE_LOCAL_FORMAT, true).startOf("day");
      const end = start.add(1, "day");
      if (!start.isValid() || !end.isValid()) return { rangeStartIso: "", rangeEndIso: "" };
      return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
    }
    const start = dayjs.utc(selectedWeek, "GGGG-[W]WW", true).startOf("isoWeek");
    const end = start.add(DAYS_IN_WEEK, "day");
    if (!start.isValid() || !end.isValid()) return { rangeStartIso: "", rangeEndIso: "" };
    return { rangeStartIso: start.toISOString(), rangeEndIso: end.toISOString() };
  }, [selectedDate, selectedWeek, timeFirstPeriod]);

  const timeFirstAnchorLabel = useMemo(() => {
    if (timeFirstPeriod === "day") {
      const d = dayjs.utc(selectedDate, DATE_LOCAL_FORMAT, true);
      return d.isValid() ? d.format("ddd, MMM D, YYYY") : "—";
    }
    if (!rangeForTimeFirstPeriod.rangeStartIso || !rangeForTimeFirstPeriod.rangeEndIso) return "—";
    return formatDateRangeLabel({
      startIso: rangeForTimeFirstPeriod.rangeStartIso,
      endIso: rangeForTimeFirstPeriod.rangeEndIso,
    });
  }, [
    rangeForTimeFirstPeriod.rangeEndIso,
    rangeForTimeFirstPeriod.rangeStartIso,
    selectedDate,
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
                  {dayjs.utc(selectedDate, DATE_LOCAL_FORMAT, true).isValid()
                    ? dayjs.utc(selectedDate, DATE_LOCAL_FORMAT, true).format("ddd, MMM D, YYYY")
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
                      if (!rangeForSelectedDate.rangeStartIso || !rangeForSelectedDate.rangeEndIso) {
                        setError("Please select a valid date.");
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
                    setWeekDaySlots({});
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
                </select>

                <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {timeFirstPeriod === "day"
                    ? "Date"
                    : timeFirstPeriod === "week"
                      ? "Week"
                      : "Date"}
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
                    onChange={(e) => {
                      setSelectedWeek(e.target.value);
                      setWeekDaySlots({});
                      setSelectedTrainer(null);
                      setError(null);
                    }}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    aria-label="Select week"
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
                        <select
                          id="start-clock-time"
                          value={startClockTime}
                          onChange={(e) => {
                            setStartClockTime(e.target.value);
                            setError(null);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                          required
                          aria-label="Session start time"
                        >
                          {clockTimeOptions.map((t) => {
                            const endMinutes = clockTimeToMinutes(endClockTime);
                            const optionMinutes = clockTimeToMinutes(t);
                            const isDisabled =
                              endMinutes !== null && optionMinutes !== null ? optionMinutes >= endMinutes : false;
                            return (
                              <option key={t} value={t} disabled={isDisabled}>
                                {t}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="end-clock-time"
                          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          End time
                        </label>
                        <select
                          id="end-clock-time"
                          value={endClockTime}
                          onChange={(e) => {
                            setEndClockTime(e.target.value);
                            setError(null);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                          required
                          aria-label="Session end time"
                        >
                          {clockTimeOptions.map((t) => {
                            const startMinutes = clockTimeToMinutes(startClockTime);
                            const optionMinutes = clockTimeToMinutes(t);
                            const isDisabled =
                              startMinutes !== null && optionMinutes !== null ? optionMinutes <= startMinutes : false;
                            return (
                              <option key={t} value={t} disabled={isDisabled}>
                                {t}
                              </option>
                            );
                          })}
                        </select>
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
                    <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Choose expected slots (max 1 per day)
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Pick start/end time for any day(s) you want. You’ll choose the trainer in Step 2.
                    </div>
                    {!timeFirstWeekStart ? (
                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Please select a valid week.
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-2" role="list">
                        {weekDates.map((d) => {
                          const slot = weekDaySlots[d.dateLocal];
                          const hasSlot = Boolean(slot);
                          return (
                            <li
                              key={d.dateLocal}
                              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                  {d.label}
                                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                    ({d.dateLocal})
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center">
                                  <select
                                    value={slot?.startClockTime ?? ""}
                                    onChange={(e) => {
                                      const nextValue = e.target.value;
                                      setWeekDaySlots((prev) => ({
                                        ...prev,
                                        [d.dateLocal]: {
                                          startClockTime: nextValue,
                                          endClockTime: prev[d.dateLocal]?.endClockTime ?? "",
                                        },
                                      }));
                                      setError(null);
                                    }}
                                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                    aria-label={`Start time for ${d.dateLocal}`}
                                  >
                                    <option value="">Start</option>
                                    {clockTimeOptions.map((t) => {
                                      const endMinutes = clockTimeToMinutes(slot?.endClockTime ?? "");
                                      const optionMinutes = clockTimeToMinutes(t);
                                      const isDisabled =
                                        endMinutes !== null && optionMinutes !== null ? optionMinutes >= endMinutes : false;
                                      return (
                                        <option key={t} value={t} disabled={isDisabled}>
                                          {t}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <select
                                    value={slot?.endClockTime ?? ""}
                                    onChange={(e) => {
                                      const nextValue = e.target.value;
                                      setWeekDaySlots((prev) => ({
                                        ...prev,
                                        [d.dateLocal]: {
                                          startClockTime: prev[d.dateLocal]?.startClockTime ?? "",
                                          endClockTime: nextValue,
                                        },
                                      }));
                                      setError(null);
                                    }}
                                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                    aria-label={`End time for ${d.dateLocal}`}
                                  >
                                    <option value="">End</option>
                                    {clockTimeOptions.map((t) => {
                                      const startMinutes = clockTimeToMinutes(slot?.startClockTime ?? "");
                                      const optionMinutes = clockTimeToMinutes(t);
                                      const isDisabled =
                                        startMinutes !== null && optionMinutes !== null ? optionMinutes <= startMinutes : false;
                                      return (
                                        <option key={t} value={t} disabled={isDisabled}>
                                          {t}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={!hasSlot}
                                    onClick={() => {
                                      setWeekDaySlots((prev) => {
                                        const next: WeekDaySlotMap = { ...prev };
                                        delete next[d.dateLocal];
                                        return next;
                                      });
                                      setError(null);
                                    }}
                                    aria-label={`Clear slot for ${d.dateLocal}`}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
            ) : resolvedMode === "timeFirst" && timeFirstPeriod === "week" ? (
              <>
                <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trainer
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select the trainer you want to request this weekly schedule with.
                </div>
                <div className="mt-3 space-y-2">
                  {isLoadingTrainers ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading trainers…</div>
                  ) : trainerList.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No trainers found.</div>
                  ) : (
                    <ul className="max-h-[22rem] space-y-2 overflow-y-auto pr-1 no-scrollbar" role="list" tabIndex={0}>
                      {trainerList.map((t) => (
                        <li key={t.id}>
                          <UserCard
                            user={t}
                            onClick={() => {
                              setSelectedTrainer(t);
                              setError(null);
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
                  <ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto px-1 no-scrollbar" role="list" tabIndex={0}>
                    {availableSlots.map((s) => {
                      const isSelected =
                        selectedSlot?.startTime === s.startTime && selectedSlot?.endTime === s.endTime;
                      const label = `${formatInstantUtc(s.startTime, "MMM D, HH:mm")} → ${formatInstantUtc(
                        s.endTime,
                        "HH:mm",
                      )}`;
                      return (
                        <li key={`${s.startTime}-${s.endTime}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 ${
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
            ) : resolvedMode === "timeFirst" && timeFirstPeriod === "week" ? (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Slots:{" "}
                {Object.keys(weekDaySlots).length > 0 ? (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {Object.keys(weekDaySlots).length} day(s) selected
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
                  if (resolvedMode === "timeFirst" && timeFirstPeriod === "week") {
                    if (!timeFirstWeekStart) {
                      setError("Please select a valid week.");
                      return;
                    }
                    const entries = Object.entries(weekDaySlots);
                    if (entries.length === 0) {
                      setError("Please select at least 1 day slot.");
                      return;
                    }
                    const slotsToCreate = entries.map(([dateLocal, slot]) => ({
                      dateLocal,
                      startClockTime: slot.startClockTime,
                      endClockTime: slot.endClockTime,
                    }));
                    const invalid = slotsToCreate.find((s) => {
                      if (!s.startClockTime || !s.endClockTime) return true;
                      const startIso = combineDateAndTimeToIso({ dateLocal: s.dateLocal, timeLocal: s.startClockTime });
                      const endIso = combineDateAndTimeToIso({ dateLocal: s.dateLocal, timeLocal: s.endClockTime });
                      if (!startIso || !endIso) return true;
                      if (!isOnThirtyMinuteStep(startIso) || !isOnThirtyMinuteStep(endIso)) return true;
                      if (!isValidMinDuration(startIso, endIso)) return true;
                      return false;
                    });
                    if (invalid) {
                      setError("Each selected day must have a valid time range (30-min steps, at least 1 hour).");
                      return;
                    }
                    void (async () => {
                      setIsSubmitting(true);
                      setError(null);
                      let createdCount = 0;
                      let failedCount = 0;
                      let firstError: string | null = null;
                      for (const s of slotsToCreate) {
                        const startIso = combineDateAndTimeToIso({ dateLocal: s.dateLocal, timeLocal: s.startClockTime });
                        const endIso = combineDateAndTimeToIso({ dateLocal: s.dateLocal, timeLocal: s.endClockTime });
                        if (!startIso || !endIso) {
                          failedCount += 1;
                          firstError = firstError ?? "Invalid date/time selected.";
                          continue;
                        }
                        try {
                          await createBooking({
                            trainerId: selectedTrainer.id,
                            startTime: startIso,
                            endTime: endIso,
                          });
                          createdCount += 1;
                        } catch (err) {
                          failedCount += 1;
                          firstError = firstError ?? getErrorMessage(err, "Failed to create one or more bookings");
                        }
                      }
                      if (failedCount === 0) {
                        toast.success(`Created ${createdCount} booking(s)`);
                        onSuccess();
                        handleClose();
                        return;
                      }
                      const summary = `Created ${createdCount} booking(s), failed ${failedCount}.`;
                      setError(firstError ? `${summary} ${firstError}` : summary);
                      toast.error(firstError ? `${summary} ${firstError}` : summary);
                      setIsSubmitting(false);
                    })();
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
