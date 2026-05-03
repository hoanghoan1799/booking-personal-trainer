"use client";

import { useEffect, useId, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { CalenderIcon } from "@/icons";

export type FlatpickrDateOnlyInputProps = {
  readonly value: string;
  readonly onDateChange: (dateLocal: string) => void;
  readonly minDate?: string;
  readonly disabled?: boolean;
  readonly ariaLabel: string;
  readonly placeholder?: string;
  readonly className?: string;
};

/**
 * Date-only picker (no time) using Flatpickr. Time is edited separately.
 */
export default function FlatpickrDateOnlyInput({
  value,
  onDateChange,
  minDate,
  disabled = false,
  ariaLabel,
  placeholder = "Select date",
  className = "",
}: FlatpickrDateOnlyInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const instanceRef = useRef<flatpickr.Instance | null>(null);
  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const fp = flatpickr(el, {
      static: true,
      monthSelectorType: "static",
      enableTime: false,
      clickOpens: !disabled,
      dateFormat: "Y-m-d",
      minDate: minDate ?? undefined,
      defaultDate: value || undefined,
      onChange: (_dates, dateStr) => {
        if (dateStr) onDateChangeRef.current(dateStr);
      },
    });
    instanceRef.current = fp;
    return () => {
      fp.destroy();
      instanceRef.current = null;
    };
    // Mount once; value/minDate/disabled sync in separate effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flatpickr instance lifecycle
  }, []);

  useEffect(() => {
    const fp = instanceRef.current;
    if (!fp) return;
    fp.set("minDate", minDate ?? undefined);
  }, [minDate]);

  useEffect(() => {
    const fp = instanceRef.current;
    if (!fp) return;
    fp.set("clickOpens", !disabled);
  }, [disabled]);

  useEffect(() => {
    const fp = instanceRef.current;
    if (!fp) return;
    if (value) fp.setDate(value, false);
    else fp.clear();
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800"
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
        aria-hidden
      >
        <CalenderIcon className="size-5" />
      </span>
    </div>
  );
}
