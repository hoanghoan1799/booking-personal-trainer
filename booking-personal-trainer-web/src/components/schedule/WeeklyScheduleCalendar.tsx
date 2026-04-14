"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Booking } from "@/services/bookings/bookings.service";
import type {
  TrainerAvailability,
  TrainerTimeOff,
} from "@/services/trainer-schedule/trainer-schedule.types";

type WeeklyScheduleCalendarProps = {
  readonly availabilities: TrainerAvailability[];
  readonly timeOff: TrainerTimeOff[];
  readonly bookings: Booking[];
  readonly onCreateSelection?: (input: {
    dayIndex: number;
    startMinute: number;
    endMinute: number;
    weekStart: Date;
  }) => void;
  readonly onEventClick?: (input: {
    eventType: "availability" | "timeOff" | "booking";
    id: string;
  }) => void;
};

type CalendarEvent = {
  readonly id: string;
  readonly entityId: string;
  readonly dayIndex: number;
  readonly startMinute: number;
  readonly endMinute: number;
  readonly label: string;
  readonly variant: "availability" | "timeOff" | "booking";
};

const HOUR_ROW_HEIGHT_PX = 32 as const;
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const MIN_SELECTION_MINUTES = 30 as const;
const MINUTES_STEP = 30 as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getIsoDayOfWeek = (date: Date): number => {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
};

const getStartOfWeekMonday = (date: Date): Date => {
  const isoDay = getIsoDayOfWeek(date);
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (isoDay - 1));
  return monday;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfLocalDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isPastCalendarDay = (dayDate: Date): boolean => {
  return startOfLocalDay(dayDate).getTime() < startOfLocalDay(new Date()).getTime();
};

const isTodayLocal = (dayDate: Date): boolean => {
  return startOfLocalDay(dayDate).getTime() === startOfLocalDay(new Date()).getTime();
};

/**
 * First minute-of-day (0–1440) on this calendar day whose local datetime is strictly after Date.now().
 * null = no selectable slot remains (entire day in the past, or no future step left today).
 */
const getFirstSelectableMinuteOnDay = (dayDate: Date): number | null => {
  if (isPastCalendarDay(dayDate)) {
    return null;
  }
  const nowMs: number = Date.now();
  for (let m = 0; m <= END_HOUR * 60; m += MINUTES_STEP) {
    const dt = new Date(
      dayDate.getFullYear(),
      dayDate.getMonth(),
      dayDate.getDate(),
      Math.floor(m / 60),
      m % 60,
      0,
      0,
    );
    if (dt.getTime() > nowMs) {
      return m;
    }
  }
  return null;
};

const clampDragRangeForDay = (
  dayDate: Date,
  anchorMinute: number,
  otherMinute: number,
): { start: number; end: number } | null => {
  const minM = getFirstSelectableMinuteOnDay(dayDate);
  if (minM === null) {
    return null;
  }
  const lo = Math.min(anchorMinute, otherMinute);
  const hi = Math.max(anchorMinute, otherMinute);
  const lo2 = Math.max(lo, minM);
  const hi2 = Math.max(hi, lo2);
  return { start: lo2, end: hi2 };
};

const getMinutesFromLocalDate = (date: Date): number =>
  date.getHours() * 60 + date.getMinutes();

const getTimeLabel = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatDayHeader = (date: Date): string => {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  return `${weekday} ${month} ${day}`;
};

const getClockTimeFromIso = (isoString: string): { hour: number; minute: number } | null => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return { hour: date.getHours(), minute: date.getMinutes() };
};

const createEventsForWeek = (input: {
  weekStart: Date;
  availabilities: TrainerAvailability[];
  timeOff: TrainerTimeOff[];
  bookings: Booking[];
}): CalendarEvent[] => {
  const weekStart = input.weekStart;
  const weekEnd = addDays(weekStart, 7);

  const availabilityEvents: CalendarEvent[] = input.availabilities.flatMap((a) => {
    const start = new Date(a.startTime);
    const end = new Date(a.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [];
    }
    if (end.getTime() <= weekStart.getTime() || start.getTime() >= weekEnd.getTime()) {
      return [];
    }
    const dayIndex = getIsoDayOfWeek(start) - 1;
    const startMinute = getMinutesFromLocalDate(start);
    const endMinute = getMinutesFromLocalDate(end);
    const event: CalendarEvent = {
      id: `availability-${a.id}`,
      entityId: a.id,
      dayIndex,
      startMinute,
      endMinute,
      label: "Availability",
      variant: "availability",
    };
    return [event];
  });

  const bookingEvents: CalendarEvent[] = input.bookings.flatMap((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [];
    }
    if (end.getTime() <= weekStart.getTime() || start.getTime() >= weekEnd.getTime()) {
      return [];
    }
    const dayIndex = getIsoDayOfWeek(start) - 1;
    const startMinute = getMinutesFromLocalDate(start);
    const endMinute = getMinutesFromLocalDate(end);
    const event: CalendarEvent = {
      id: `booking-${b.id}`,
      entityId: b.id,
      dayIndex,
      startMinute,
      endMinute,
      label: `Booking (${b.status})`,
      variant: "booking",
    };
    return [event];
  });

  const timeOffEvents: CalendarEvent[] = input.timeOff
    .flatMap((t) => {
      const start = new Date(t.startTime);
      const end = new Date(t.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return [];
      }
      if (end.getTime() <= weekStart.getTime() || start.getTime() >= weekEnd.getTime()) {
        return [];
      }
      const events: CalendarEvent[] = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = addDays(weekStart, i);
        const dayEnd = addDays(dayStart, 1);
        const segmentStart = new Date(Math.max(dayStart.getTime(), start.getTime()));
        const segmentEnd = new Date(Math.min(dayEnd.getTime(), end.getTime()));
        if (segmentEnd.getTime() <= segmentStart.getTime()) {
          continue;
        }
        events.push({
          id: `timeoff-${t.id}-${i}`,
          entityId: t.id,
          dayIndex: i,
          startMinute: getMinutesFromLocalDate(segmentStart),
          endMinute: getMinutesFromLocalDate(segmentEnd),
          label: `Time off: ${t.reason}`,
          variant: "timeOff",
        });
      }
      return events;
    });

  return [...availabilityEvents, ...timeOffEvents, ...bookingEvents];
};

const getEventStyle = (variant: CalendarEvent["variant"]): string => {
  if (variant === "availability") {
    return "border border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300";
  }
  if (variant === "timeOff") {
    return "border border-error-500/40 bg-error-500/10 text-error-700 dark:text-error-400";
  }
  return "border border-gray-500/30 bg-gray-500/10 text-gray-800 dark:text-white/80";
};

const WeeklyScheduleCalendar: React.FC<WeeklyScheduleCalendarProps> = ({
  availabilities,
  timeOff,
  bookings,
  onCreateSelection,
  onEventClick,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selection, setSelection] = useState<{
    dayIndex: number;
    startMinute: number;
    endMinute: number;
  } | null>(null);
  const selectionRef = useRef<{
    dayIndex: number;
    startMinute: number;
    endMinute: number;
  } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragSurfaceRectRef = useRef<DOMRect | null>(null);
  const dragMinMinuteRef = useRef<number>(0);
  const dragDayIndexRef = useRef<number>(0);
  const dragDayDateRef = useRef<Date>(new Date());
  const dragListenersRef = useRef<{
    move: (e: MouseEvent) => void;
    up: (e: MouseEvent) => void;
  } | null>(null);

  const weekStart = useMemo((): Date => {
    const now = new Date();
    const base = getStartOfWeekMonday(now);
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo((): Date[] => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const events = useMemo((): CalendarEvent[] => {
    return createEventsForWeek({ weekStart, availabilities, timeOff, bookings });
  }, [availabilities, bookings, timeOff, weekStart]);

  const timeLabels = useMemo((): string[] => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
      const hour = START_HOUR + i;
      return `${String(hour).padStart(2, "0")}:00`;
    });
  }, []);

  const handlePrevWeek = useCallback(() => setWeekOffset((p) => p - 1), []);
  const handleNextWeek = useCallback(() => setWeekOffset((p) => p + 1), []);
  const handleThisWeek = useCallback(() => setWeekOffset(0), []);

  const gridHeightPx = useMemo((): number => (TOTAL_MINUTES / 60) * HOUR_ROW_HEIGHT_PX, []);

  const weekRangeLabel = useMemo((): string => {
    const weekEnd = addDays(weekStart, 6);
    const startLabel = weekStart.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const endLabel = weekEnd.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return `${startLabel} - ${endLabel}`;
  }, [weekStart]);

  const getSnappedMinuteFromEvent = useCallback(
    (input: {
      clientY: number;
      containerTop: number;
      containerHeight: number;
      rangeStartMinute?: number;
      rangeEndMinute?: number;
    }): number => {
      const rangeStart = input.rangeStartMinute ?? START_HOUR * 60;
      const rangeEnd = input.rangeEndMinute ?? END_HOUR * 60;
      const y = clamp(input.clientY - input.containerTop, 0, input.containerHeight);
      const span = Math.max(rangeEnd - rangeStart, 1);
      const frac = input.containerHeight <= 0 ? 0 : y / input.containerHeight;
      const minutes = rangeStart + frac * span;
      const snapped = Math.round(minutes / MINUTES_STEP) * MINUTES_STEP;
      return clamp(snapped, rangeStart, rangeEnd);
    },
    [],
  );

  const clearDocumentDragListeners = useCallback((): void => {
    const listeners = dragListenersRef.current;
    if (!listeners) {
      return;
    }
    document.removeEventListener("mousemove", listeners.move);
    document.removeEventListener("mouseup", listeners.up);
    dragListenersRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearDocumentDragListeners();
    };
  }, [clearDocumentDragListeners]);

  const finalizeDragSelection = useCallback(
    (
      dayIndex: number,
      dayDate: Date,
      minM: number,
      current: { dayIndex: number; startMinute: number; endMinute: number },
    ): void => {
      if (!onCreateSelection) {
        return;
      }
      if (!current || current.dayIndex !== dayIndex) {
        return;
      }
      let start = Math.min(current.startMinute, current.endMinute);
      let end = Math.max(current.startMinute, current.endMinute);
      start = Math.max(start, minM);
      end = Math.max(end, start);
      if (end - start < MIN_SELECTION_MINUTES) {
        return;
      }
      const startDt = new Date(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate(),
        Math.floor(start / 60),
        start % 60,
        0,
        0,
      );
      const endDt = new Date(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate(),
        Math.floor(end / 60),
        end % 60,
        0,
        0,
      );
      const nowMs = Date.now();
      if (startDt.getTime() <= nowMs || endDt.getTime() <= nowMs) {
        return;
      }
      onCreateSelection({ dayIndex, startMinute: start, endMinute: end, weekStart });
    },
    [onCreateSelection, weekStart],
  );

  const handleMouseDownDay = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
      if (!onCreateSelection) {
        return;
      }
      const dayDate = days[dayIndex];
      const minM = getFirstSelectableMinuteOnDay(dayDate);
      if (minM === null) {
        return;
      }
      clearDocumentDragListeners();
      const rect = event.currentTarget.getBoundingClientRect();
      dragSurfaceRectRef.current = rect;
      dragMinMinuteRef.current = minM;
      dragDayIndexRef.current = dayIndex;
      dragDayDateRef.current = dayDate;
      let startMinute = getSnappedMinuteFromEvent({
        clientY: event.clientY,
        containerTop: rect.top,
        containerHeight: rect.height,
        rangeStartMinute: minM,
        rangeEndMinute: END_HOUR * 60,
      });
      startMinute = Math.max(startMinute, minM);
      isDraggingRef.current = true;
      const nextSelection = { dayIndex, startMinute, endMinute: startMinute };
      selectionRef.current = nextSelection;
      setSelection(nextSelection);
      const handleDocMove = (me: MouseEvent): void => {
        if (!isDraggingRef.current) {
          return;
        }
        const r = dragSurfaceRectRef.current;
        const dIdx = dragDayIndexRef.current;
        const dDate = dragDayDateRef.current;
        const min = dragMinMinuteRef.current;
        if (!r) {
          return;
        }
        const rawEnd = getSnappedMinuteFromEvent({
          clientY: me.clientY,
          containerTop: r.top,
          containerHeight: r.height,
          rangeStartMinute: min,
          rangeEndMinute: END_HOUR * 60,
        });
        const anchor = selectionRef.current?.startMinute;
        if (anchor === undefined || selectionRef.current?.dayIndex !== dIdx) {
          return;
        }
        const clamped = clampDragRangeForDay(dDate, anchor, rawEnd);
        if (!clamped) {
          return;
        }
        selectionRef.current = {
          dayIndex: dIdx,
          startMinute: clamped.start,
          endMinute: clamped.end,
        };
        setSelection((prev) => {
          if (!prev || prev.dayIndex !== dIdx) {
            return prev;
          }
          return {
            ...prev,
            startMinute: clamped.start,
            endMinute: clamped.end,
          };
        });
      };
      const handleDocUp = (): void => {
        clearDocumentDragListeners();
        if (!isDraggingRef.current) {
          return;
        }
        isDraggingRef.current = false;
        const dIdx = dragDayIndexRef.current;
        const dDate = dragDayDateRef.current;
        const min = dragMinMinuteRef.current;
        const currentSnapshot = selectionRef.current;
        selectionRef.current = null;
        setSelection(null);
        if (!currentSnapshot || currentSnapshot.dayIndex !== dIdx) {
          return;
        }
        finalizeDragSelection(dIdx, dDate, min, currentSnapshot);
      };
      dragListenersRef.current = { move: handleDocMove, up: handleDocUp };
      document.addEventListener("mousemove", handleDocMove);
      document.addEventListener("mouseup", handleDocUp);
    },
    [clearDocumentDragListeners, days, finalizeDragSelection, getSnappedMinuteFromEvent, onCreateSelection],
  );

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
      aria-label="Weekly calendar"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Week calendar
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {weekRangeLabel}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:text-white/80 dark:hover:bg-gray-900 dark:focus:ring-offset-gray-900"
            aria-label="Previous week"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={handleThisWeek}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:text-white/80 dark:hover:bg-gray-900 dark:focus:ring-offset-gray-900"
            aria-label="This week"
          >
            This week
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:text-white/80 dark:hover:bg-gray-900 dark:focus:ring-offset-gray-900"
            aria-label="Next week"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[72px_1fr] gap-3">
        <div className="pt-10">
          <div style={{ height: gridHeightPx }} aria-label="Time labels">
            {timeLabels.map((label) => (
              <div
                key={label}
                className="flex items-start justify-end pr-2 text-[11px] text-gray-500 dark:text-gray-400"
                style={{ height: HOUR_ROW_HEIGHT_PX }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto no-scrollbar">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className={`rounded-lg border border-gray-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-white/80 ${
                    isPastCalendarDay(d) ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {formatDayHeader(d)}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((d, dayIndex) => {
                const dayEvents = events.filter((e) => e.dayIndex === dayIndex);
                const firstSelectableMinute = getFirstSelectableMinuteOnDay(d);
                const canDragCreate = firstSelectableMinute !== null && Boolean(onCreateSelection);
                const isPastDay = isPastCalendarDay(d);
                const pastBlockTopPx =
                  isTodayLocal(d) && firstSelectableMinute !== null && firstSelectableMinute > 0
                    ? (firstSelectableMinute / 60) * HOUR_ROW_HEIGHT_PX
                    : 0;
                return (
                  <div
                    key={d.toISOString()}
                    className={`relative rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${
                      !canDragCreate ? "opacity-60" : ""
                    } ${isPastDay ? "ring-1 ring-inset ring-gray-300/70 dark:ring-gray-700" : ""}`}
                    style={{ height: gridHeightPx }}
                    aria-label={`Calendar day ${formatDayHeader(d)}`}
                    aria-disabled={!canDragCreate}
                  >
                    {timeLabels.slice(0, -1).map((label) => (
                      <div
                        key={label}
                        className="border-b border-gray-100 dark:border-gray-800"
                        style={{ height: HOUR_ROW_HEIGHT_PX }}
                        aria-hidden="true"
                      />
                    ))}

                    {isTodayLocal(d) && pastBlockTopPx > 0 && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 top-0 z-[4] bg-gray-200/55 dark:bg-gray-800/55"
                        style={{ height: pastBlockTopPx }}
                        aria-hidden="true"
                      />
                    )}

                    {canDragCreate && (
                      <div
                        className="absolute bottom-0 left-0 right-0 z-[5] cursor-crosshair touch-none select-none"
                        style={{ top: pastBlockTopPx }}
                        onMouseDown={(e) => handleMouseDownDay(e, dayIndex)}
                        aria-label="Drag to select a future time range"
                      />
                    )}

                    {isPastDay && (
                      <div
                        className="absolute inset-0 z-[20] cursor-not-allowed bg-gray-300/40 dark:bg-gray-950/45"
                        aria-hidden="true"
                      />
                    )}

                    {selection && selection.dayIndex === dayIndex && (
                      <div
                        className="pointer-events-none absolute left-1 right-1 z-[6] rounded-md border border-brand-500/40 bg-brand-500/10"
                        style={{
                          top:
                            ((Math.min(selection.startMinute, selection.endMinute) -
                              START_HOUR * 60) /
                              60) *
                            HOUR_ROW_HEIGHT_PX,
                          height:
                            ((Math.max(selection.startMinute, selection.endMinute) -
                              Math.min(selection.startMinute, selection.endMinute)) /
                              60) *
                            HOUR_ROW_HEIGHT_PX,
                        }}
                        aria-label="Selected time range"
                      />
                    )}

                    {dayEvents.map((e) => {
                      const start = clamp(e.startMinute, START_HOUR * 60, END_HOUR * 60);
                      const end = clamp(e.endMinute, START_HOUR * 60, END_HOUR * 60);
                      if (end <= start) {
                        return null;
                      }
                      const topPx = ((start - START_HOUR * 60) / 60) * HOUR_ROW_HEIGHT_PX;
                      const heightPx = ((end - start) / 60) * HOUR_ROW_HEIGHT_PX;
                      return (
                        <div
                          key={e.id}
                          className={`absolute left-1 right-1 z-[12] overflow-hidden rounded-md px-2 py-1 text-[11px] ${getEventStyle(
                            e.variant,
                          )}`}
                          style={{ top: topPx, height: Math.max(20, heightPx) }}
                          aria-label={e.label}
                          title={e.label}
                        >
                          {onEventClick && (
                            <button
                              type="button"
                              className="absolute inset-0 z-10 cursor-pointer bg-transparent"
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                onEventClick({
                                  eventType: e.variant,
                                  id: e.entityId,
                                });
                              }}
                              onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
                              onKeyDown={(keyEvent) => {
                                if (keyEvent.key !== "Enter" && keyEvent.key !== " ") {
                                  return;
                                }
                                keyEvent.preventDefault();
                                keyEvent.stopPropagation();
                                onEventClick({
                                  eventType: e.variant,
                                  id: e.entityId,
                                });
                              }}
                              aria-label={`Edit ${e.label}`}
                            />
                          )}
                          <div className="truncate font-semibold">{e.label}</div>
                          <div className="truncate opacity-80">
                            {getTimeLabel(new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(start / 60), start % 60))}{" "}
                            -{" "}
                            {getTimeLabel(new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(end / 60), end % 60))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-brand-500/40 bg-brand-500/10" />
          Availability
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-error-500/40 bg-error-500/10" />
          Time off
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-gray-500/30 bg-gray-500/10" />
          Bookings
        </div>
        <div className="ml-auto text-[11px] text-gray-500 dark:text-gray-400">
          Visible hours: {String(START_HOUR).padStart(2, "0")}:00 -{" "}
          {String(END_HOUR).padStart(2, "0")}:00
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleCalendar;

