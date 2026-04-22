"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "@/lib/date-time/utc-dayjs";
import { formatInstantUtc } from "@/lib/date-time/utc-date-time.helper";
import type { User } from "@/types/user.types";
import { createBooking, createBookingsBulk } from "@/services/bookings/bookings.service";
import { getAvailableTrainers, getAvailableTrainersForPeriod } from "@/services/booking-discovery/booking-discovery.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import UserCard from "@/components/users/UserCard";

interface CreateBookingFromCalendarModalProps {
  readonly isOpen: boolean;
  readonly selectedDateLocal: string;
  readonly prefilledStartClockTime?: string | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DATE_LOCAL_FORMAT = "YYYY-MM-DD";
const TIME_LOCAL_FORMAT = "HH:mm";
const STEP_MINUTES = 30;
const MIN_DURATION_MINUTES = 60;

type BookingPeriod = "day" | "week" | "month" | "year";

const NO_TRAINER_AVAILABLE_FOR_PERIOD_MESSAGE =
  "No trainer is available for the selected time across the chosen period.";

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

function combineDateAndTimeToIso(input: { readonly dateLocal: string; readonly timeLocal: string }): string | null {
  const date = dayjs.utc(input.dateLocal, DATE_LOCAL_FORMAT, true);
  if (!date.isValid()) return null;
  if (!isValidClockTime(input.timeLocal)) return null;
  const combined = dayjs.utc(`${input.dateLocal} ${input.timeLocal}`, "YYYY-MM-DD HH:mm", true);
  if (!combined.isValid()) return null;
  return combined.toISOString();
}

function isOnThirtyMinuteStep(iso: string): boolean {
  const d = dayjs.utc(iso);
  if (!d.isValid()) return false;
  return d.second() === 0 && d.millisecond() === 0 && d.minute() % STEP_MINUTES === 0;
}

function isValidMinDuration(startIso: string, endIso: string): boolean {
  const start = dayjs.utc(startIso);
  const end = dayjs.utc(endIso);
  if (!start.isValid() || !end.isValid()) return false;
  return end.diff(start, "minute") >= MIN_DURATION_MINUTES;
}

function getPeriodDates(input: { readonly selectedDateLocal: string; readonly period: BookingPeriod }): readonly string[] {
  const anchor = dayjs.utc(input.selectedDateLocal, DATE_LOCAL_FORMAT, true).startOf("day");
  if (!anchor.isValid()) return [];
  if (input.period === "day") return [anchor.format(DATE_LOCAL_FORMAT)];
  const start = anchor;
  const endExclusive = input.period === "week" ? start.add(7, "day") : input.period === "month" ? start.add(1, "month") : start.add(1, "year");
  const dayCount = endExclusive.diff(start, "day");
  if (!Number.isFinite(dayCount) || dayCount <= 0) return [];
  return Array.from({ length: dayCount }).map((_, i) => start.add(i, "day").format(DATE_LOCAL_FORMAT));
}

export default function CreateBookingFromCalendarModal({
  isOpen,
  selectedDateLocal,
  prefilledStartClockTime = null,
  onClose,
  onSuccess,
}: CreateBookingFromCalendarModalProps) {
  const toast = useToast();
  const [availableTrainerList, setAvailableTrainerList] = useState<User[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
  const [selectedTrainer, setSelectedTrainer] = useState<User | null>(null);
  const [startDateLocal, setStartDateLocal] = useState<string>(selectedDateLocal);
  const [startClockTime, setStartClockTime] = useState<string>("");
  const [endClockTime, setEndClockTime] = useState<string>("");
  const [period, setPeriod] = useState<BookingPeriod>("day");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const clockTimeOptions = useMemo(() => getClockTimeOptions(), []);

  const selectedDateLabel = useMemo(() => {
    const d = dayjs.utc(selectedDateLocal, DATE_LOCAL_FORMAT, true);
    return d.isValid() ? d.format("ddd, MMM D, YYYY") : "—";
  }, [selectedDateLocal]);

  const periodDates = useMemo(() => getPeriodDates({ selectedDateLocal, period }), [period, selectedDateLocal]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPeriod("day");
    setSelectedTrainer(null);
    setStartDateLocal(selectedDateLocal);
    setStartClockTime(prefilledStartClockTime ?? "");
    setEndClockTime("");
    setAvailableTrainerList([]);
  }, [isOpen, prefilledStartClockTime, selectedDateLocal]);

  const handleFindAvailableTrainers = async () => {
    setError(null);
    setAvailableTrainerList([]);
    setSelectedTrainer(null);
    const dateLocalForValidation = startDateLocal;
    const startIso = combineDateAndTimeToIso({ dateLocal: dateLocalForValidation, timeLocal: startClockTime });
    const endIso = combineDateAndTimeToIso({ dateLocal: dateLocalForValidation, timeLocal: endClockTime });
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
    setIsLoadingAvailability(true);
    try {
      if (period === "day") {
        const trainers = await getAvailableTrainers({ startTime: startIso, endTime: endIso });
        setAvailableTrainerList(trainers);
        return;
      }
      const trainers = await getAvailableTrainersForPeriod({
        startDate: startDateLocal,
        startClockTime,
        endClockTime,
        period,
      });
      setAvailableTrainerList(trainers);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load available trainers"));
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selectedTrainer) {
      setError("Please select a trainer.");
      return;
    }
    const startDate = dayjs.utc(startDateLocal, DATE_LOCAL_FORMAT, true);
    if (!startDate.isValid()) {
      setError("Selected date is invalid.");
      return;
    }
    const startMinutes = clockTimeToMinutes(startClockTime);
    const endMinutes = clockTimeToMinutes(endClockTime);
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      setError("Please select a valid time range.");
      return;
    }
    const dateList = periodDates;
    if (dateList.length === 0) {
      setError("Please select a valid period.");
      return;
    }
    const slotsToCreate = dateList.map((dateLocal) => {
      const startIso = combineDateAndTimeToIso({ dateLocal, timeLocal: startClockTime });
      const endIso = combineDateAndTimeToIso({ dateLocal, timeLocal: endClockTime });
      return { dateLocal, startIso, endIso };
    });
    const invalid = slotsToCreate.find((s) => !s.startIso || !s.endIso);
    if (invalid) {
      setError("Invalid date/time selected.");
      return;
    }
    const invalidTime = slotsToCreate.find((s) => {
      if (!s.startIso || !s.endIso) return true;
      if (!isOnThirtyMinuteStep(s.startIso) || !isOnThirtyMinuteStep(s.endIso)) return true;
      if (!isValidMinDuration(s.startIso, s.endIso)) return true;
      return false;
    });
    if (invalidTime) {
      setError("Each day must have a valid time range (30-min steps, at least 1 hour).");
      return;
    }
    setIsSubmitting(true);
    try {
      if (period !== "day") {
        const availableTrainers = await getAvailableTrainersForPeriod({
          startDate: startDateLocal,
          startClockTime,
          endClockTime,
          period,
        });
        const isTrainerAvailable = availableTrainers.some((t) => t.id === selectedTrainer.id);
        if (!isTrainerAvailable) {
          setError(NO_TRAINER_AVAILABLE_FOR_PERIOD_MESSAGE);
          toast.error(NO_TRAINER_AVAILABLE_FOR_PERIOD_MESSAGE);
          return;
        }
        await createBookingsBulk({
          trainerId: selectedTrainer.id,
          startDate: startDateLocal,
          startClockTime,
          endClockTime,
          period,
        });
        toast.success(`Created booking series (${slotsToCreate.length} session(s))`);
        onSuccess();
        return;
      }
      await createBooking({
        trainerId: selectedTrainer.id,
        startTime: slotsToCreate[0]?.startIso as string,
        endTime: slotsToCreate[0]?.endIso as string,
      });
      toast.success("Booking created successfully");
      onSuccess();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create booking");
      toast.error(msg);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="mx-4 w-full max-w-3xl p-6">
      <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Create booking</h3>
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Selected on calendar: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedDateLabel}</span>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Booking details</div>

          <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Date</div>
          <input
            type="date"
            value={startDateLocal}
            onChange={(e) => {
              setStartDateLocal(e.target.value);
              setAvailableTrainerList([]);
              setSelectedTrainer(null);
              setError(null);
            }}
            className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            aria-label="Select booking date"
          />

          <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Time</div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="calendar-booking-start" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start time
              </label>
              <select
                id="calendar-booking-start"
                value={startClockTime}
                onChange={(e) => {
                  setStartClockTime(e.target.value);
                  setAvailableTrainerList([]);
                  setSelectedTrainer(null);
                  setError(null);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                aria-label="Select start time"
              >
                <option value="" disabled>
                  Start
                </option>
                {clockTimeOptions.map((t) => {
                  const endMinutes = clockTimeToMinutes(endClockTime);
                  const optionMinutes = clockTimeToMinutes(t);
                  const isDisabled = endMinutes !== null && optionMinutes !== null ? optionMinutes >= endMinutes : false;
                  return (
                    <option key={t} value={t} disabled={isDisabled}>
                      {t}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="calendar-booking-end" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End time
              </label>
              <select
                id="calendar-booking-end"
                value={endClockTime}
                onChange={(e) => {
                  setEndClockTime(e.target.value);
                  setAvailableTrainerList([]);
                  setSelectedTrainer(null);
                  setError(null);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                aria-label="Select end time"
              >
                <option value="" disabled>
                  End
                </option>
                {clockTimeOptions.map((t) => {
                  const startMinutes = clockTimeToMinutes(startClockTime);
                  const optionMinutes = clockTimeToMinutes(t);
                  const isDisabled = startMinutes !== null && optionMinutes !== null ? optionMinutes <= startMinutes : false;
                  return (
                    <option key={t} value={t} disabled={isDisabled}>
                      {t}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {(() => {
              const dateLocalForLabel = startDateLocal;
              const startIso = combineDateAndTimeToIso({ dateLocal: dateLocalForLabel, timeLocal: startClockTime });
              const endIso = combineDateAndTimeToIso({ dateLocal: dateLocalForLabel, timeLocal: endClockTime });
              if (!startIso || !endIso) return "—";
              return `${formatInstantUtc(startIso, "ddd, D MMM YYYY, HH:mm")} → ${formatInstantUtc(endIso, "HH:mm")}`;
            })()}
          </div>

          <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">Period</div>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as BookingPeriod);
              setAvailableTrainerList([]);
              setSelectedTrainer(null);
              setError(null);
            }}
            className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            aria-label="Select booking period"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {period === "day"
              ? `Selected day: ${startDateLocal}`
              : `Rolling range: ${startDateLocal} → ${dayjs
                  .utc(startDateLocal, DATE_LOCAL_FORMAT, true)
                  .startOf("day")
                  .add(period === "week" ? 7 : period === "month" ? 1 : 1, period === "week" ? "day" : period)
                  .subtract(1, "day")
                  .format(DATE_LOCAL_FORMAT)}`}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will create {periodDates.length} booking(s).
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleFindAvailableTrainers()}
              disabled={isLoadingAvailability || isSubmitting}
              aria-label="Find available trainers"
            >
              {isLoadingAvailability ? "Finding…" : "Find available trainers"}
            </Button>
          </div>

          <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">Trainer</div>
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
                    isSelected={selectedTrainer?.id === t.id}
                    onClick={() => {
                      setSelectedTrainer(t);
                      setError(null);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} aria-label="Cancel booking creation">
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void handleSubmit()} disabled={isSubmitting} aria-label="Confirm booking">
              {isSubmitting ? "Booking..." : "Book"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error-600 dark:text-error-500" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

