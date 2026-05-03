"use client";

const TrainerCardSkeleton = () => (
  <div
    className="flex animate-pulse items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800"
    aria-hidden
  >
    <div className="flex flex-col gap-2">
      <div className="h-4 w-36 rounded-md bg-gray-200 dark:bg-gray-700 sm:w-44" />
      <div className="h-3 w-48 max-w-full rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="h-5 w-14 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

const SlotRowSkeleton = () => (
  <div
    className="w-full animate-pulse rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
    aria-hidden
  >
    <div className="h-4 w-full max-w-[18rem] rounded-md bg-gray-200 dark:bg-gray-700" />
  </div>
);

export type BookingAvailabilityListSkeletonProps = {
  readonly variant: "trainers" | "slots";
  readonly maxHeightClass?: string;
  readonly rowCount?: number;
  /** When false, omits `mt-2` on the list (e.g. inside a parent that already has top spacing). */
  readonly withOuterMargin?: boolean;
  readonly className?: string;
};

/**
 * Placeholder list matching UserCard / slot row height to reduce layout shift while availability loads.
 */
export default function BookingAvailabilityListSkeleton({
  variant,
  maxHeightClass = "max-h-[22rem]",
  rowCount,
  withOuterMargin = true,
  className = "",
}: BookingAvailabilityListSkeletonProps) {
  const count = rowCount ?? (variant === "slots" ? 6 : 5);
  const ariaLabel = variant === "slots" ? "Loading time slots" : "Loading trainers";
  const marginClass = withOuterMargin ? "mt-2 " : "";
  const scrollPadding = variant === "slots" ? "px-1 " : "pr-1 ";
  return (
    <ul
      className={`${marginClass}${maxHeightClass} space-y-2 overflow-y-auto no-scrollbar ${scrollPadding}${className}`}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>{variant === "slots" ? <SlotRowSkeleton /> : <TrainerCardSkeleton />}</li>
      ))}
    </ul>
  );
}
