"use client";

import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { CloseLineIcon, GroupIcon, TaskIcon } from "@/icons";
import { APP_ROUTES } from "@/lib/route.constants";
import { getErrorMessage } from "@/lib/error.utils";
import { useBookings } from "@/hooks/useBookings";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/context/ToastContext";
import { requestTrainerRole } from "@/services/auth/auth.service";
import { getUsers } from "@/services/users/users.service";
import type { User } from "@/types/user.types";
import Button from "@/components/ui/button/Button";
import CreateBookingModal from "@/components/users/CreateBookingModal";
import { DashboardSection } from "./dashboard-section";
import { DashboardStatCard } from "./dashboard-stat-card";
import { DashboardStateMessage } from "./dashboard-state-message";
import { TikTokQuickAccessCard } from "./tiktok-quick-access-card";
import { BookingsTable } from "./bookings-table";
import { WorkoutsTable } from "./workouts-table";
import { TrainerDirectoryCard } from "./trainer-directory-card";

const PREVIEW_BOOKINGS = 15;
const TRAINER_PAGE_SIZE = 80;

const TRAINER_BANNER_DISMISS_PREFIX = "trainer-cta-banner-dismiss";

const TRAINER_BANNER_SUBTITLE_ID = "trainee-dashboard-trainer-banner-subtitle";

type TrainerPromoVariant = "apply" | "reapply" | "continue" | "pending";

export const TraineeDashboard = (): React.ReactNode => {
  const { user: profileUser, refetch: refetchProfile } = useProfile();
  const toast = useToast();
  const [isTrainerRequestSubmitting, setIsTrainerRequestSubmitting] = useState(false);
  const [isTrainerBannerDismissed, setIsTrainerBannerDismissed] = useState(false);
  const { bookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } =
    useBookings();
  const {
    workouts,
    isLoading: workoutsLoading,
    error: workoutsError,
    refetch: refetchWorkouts,
  } = useWorkouts({ limit: 25 });
  const [trainers, setTrainers] = useState<User[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [trainersError, setTrainersError] = useState<Error | null>(null);
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);
  const [bookingTrainer, setBookingTrainer] = useState<User | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const loadTrainers = useCallback(async () => {
    setTrainersLoading(true);
    setTrainersError(null);
    try {
      const res = await getUsers({
        role: "TRAINER",
        approvalStatus: "APPROVED",
        limit: TRAINER_PAGE_SIZE,
        page: 1,
      });
      setTrainers(res.users);
    } catch (err) {
      setTrainersError(err instanceof Error ? err : new Error("Failed to load trainers"));
      setTrainers([]);
    } finally {
      setTrainersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrainers();
  }, [loadTrainers]);

  const handleOpenBooking = (trainer: User) => {
    setBookingTrainer(trainer);
    setIsBookingModalOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingModalOpen(false);
    setBookingTrainer(null);
  };

  const handleBookingSuccess = () => {
    void refetchBookings();
    void refetchWorkouts();
    handleCloseBooking();
  };

  const handleRequestTrainerRole = async (): Promise<void> => {
    setIsTrainerRequestSubmitting(true);
    try {
      await requestTrainerRole();
      toast.success("Trainer application submitted. We will review your request.");
      await refetchProfile();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not submit trainer application."));
    } finally {
      setIsTrainerRequestSubmitting(false);
    }
  };

  const isTrainerApplicationPending =
    profileUser?.role === "TRAINEE" &&
    profileUser.userType === "TRAINER" &&
    profileUser.approvalStatus === "PENDING";
  const canSubmitTrainerApplication =
    profileUser?.role === "TRAINEE" &&
    ((profileUser.userType === "TRAINEE" && profileUser.approvalStatus === "NONE") ||
      (profileUser.userType === "TRAINER" &&
        (profileUser.approvalStatus === "REJECTED" || profileUser.approvalStatus === "NONE")));
  const showTrainerProgramBanner =
    Boolean(profileUser) && (canSubmitTrainerApplication || isTrainerApplicationPending);

  const profileSignature: string =
    profileUser != null
      ? `${profileUser.userType}-${profileUser.approvalStatus}-${profileUser.role}`
      : "";
  const dismissStorageKey: string =
    profileUser != null ? `${TRAINER_BANNER_DISMISS_PREFIX}:${profileUser.id}` : "";

  useLayoutEffect(() => {
    if (dismissStorageKey === "") {
      setIsTrainerBannerDismissed(false);
      return;
    }
    const stored: string | null = sessionStorage.getItem(dismissStorageKey);
    setIsTrainerBannerDismissed(stored === profileSignature);
  }, [dismissStorageKey, profileSignature]);

  const handleDismissTrainerBanner = (): void => {
    if (typeof window === "undefined" || dismissStorageKey === "") {
      setIsTrainerBannerDismissed(true);
      return;
    }
    sessionStorage.setItem(dismissStorageKey, profileSignature);
    setIsTrainerBannerDismissed(true);
  };

  let trainerPromoVariant: TrainerPromoVariant | null = null;
  if (isTrainerApplicationPending) {
    trainerPromoVariant = "pending";
  } else if (canSubmitTrainerApplication && profileUser) {
    if (profileUser.approvalStatus === "REJECTED") {
      trainerPromoVariant = "reapply";
    } else if (profileUser.userType === "TRAINER" && profileUser.approvalStatus === "NONE") {
      trainerPromoVariant = "continue";
    } else {
      trainerPromoVariant = "apply";
    }
  }

  const trainerBannerTitle: Record<TrainerPromoVariant, string> = {
    apply: "You can become a Trainer!",
    reapply: "You can become a Trainer!",
    continue: "Finish your trainer application",
    pending: "Your application is under review",
  };

  const trainerBannerSubtitle: Record<TrainerPromoVariant, string> = {
    apply: "Earn extra income by sharing your fitness experience",
    reapply:
      "Your last application was not approved. You can apply again whenever you are ready—we will take another look.",
    continue:
      "Complete this step to join the review queue. After approval, trainer tools will unlock on your account.",
    pending:
      "An administrator is reviewing your request. You keep full trainee access until there is a decision.",
  };

  const primaryCtaLabel: Record<Exclude<TrainerPromoVariant, "pending">, string> = {
    apply: "Become a Trainer",
    reapply: "Apply again",
    continue: "Become a Trainer",
  };

  const bookingsPreview = bookings.slice(0, PREVIEW_BOOKINGS);
  const listError = bookingsError ?? workoutsError ?? trainersError;
  const isInitialLoading =
    (bookingsLoading && bookings.length === 0) ||
    (workoutsLoading && workouts.length === 0) ||
    (trainersLoading && trainers.length === 0);

  if (isInitialLoading) {
    return <DashboardStateMessage variant="loading" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Trainee dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find a trainer, create a booking, and track your sessions.
          </p>
        </div>
        <TikTokQuickAccessCard className="w-full max-w-[320px] sm:shrink-0 sm:self-start sm:justify-self-end" />
      </div>

      {showTrainerProgramBanner && trainerPromoVariant != null && !isTrainerBannerDismissed ? (
<section
  className="w-full rounded-xl border border-[#E5E7EB] bg-gradient-to-r from-[#EFF6FF] to-[#EEF2FF] px-4 py-4 font-sans shadow-sm sm:px-5 dark:border-gray-700 dark:from-gray-900/75 dark:to-gray-900/55 dark:shadow-none"
  aria-labelledby="trainee-trainer-banner-heading"
>
  <div className="flex min-h-[72px] flex-col items-stretch justify-center gap-3 sm:min-h-[76px] sm:flex-row sm:items-center sm:gap-4">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className="flex size-10 shrink-0 select-none items-center justify-center text-2xl leading-none"
        aria-hidden
      >
        💪
      </span>
      <div className="min-w-0 flex-1">
        <h2
          id="trainee-trainer-banner-heading"
          className="text-sm font-semibold leading-snug text-gray-900 sm:text-base dark:text-white/95"
        >
          {trainerBannerTitle[trainerPromoVariant]}
        </h2>
        <p
          id={TRAINER_BANNER_SUBTITLE_ID}
          className="mt-0.5 line-clamp-2 text-xs font-normal leading-snug text-slate-600 sm:text-sm dark:text-gray-400"
        >
          {trainerBannerSubtitle[trainerPromoVariant]}
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
     {trainerPromoVariant === "pending" ? (
  <div
    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
    role="status"
    aria-live="polite"
  >
    <span
      className="size-2 rounded-full bg-amber-500 dark:bg-amber-400"
      aria-hidden="true"
    />
    <span>Application in review</span>
  </div>
) : (
  <button
    type="button"
    disabled={isTrainerRequestSubmitting}
    aria-busy={isTrainerRequestSubmitting}
    aria-describedby={TRAINER_BANNER_SUBTITLE_ID}
    aria-label={primaryCtaLabel[trainerPromoVariant]}
    onClick={() => void handleRequestTrainerRole()}
    className="inline-flex h-9 min-h-[36px] min-w-[132px] shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 text-sm font-medium text-white shadow-sm transition hover:from-[#2563EB] hover:to-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:pointer-events-none disabled:opacity-60 sm:h-10"
  >
    {isTrainerRequestSubmitting
      ? "Submitting…"
      : primaryCtaLabel[trainerPromoVariant]}
  </button>
)}
      <button
        type="button"
        onClick={handleDismissTrainerBanner}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-black/[0.04] hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-300"
        aria-label="Dismiss trainer promotion"
      >
        <CloseLineIcon className="size-5 fill-current" />
      </button>
    </div>
  </div>
</section>
      ) : null}

      {listError ? <DashboardStateMessage variant="error" message={listError.message} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DashboardStatCard
          label="Your bookings (loaded)"
          value={bookings.length}
          icon={<GroupIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="Your workouts (loaded)"
          value={workouts.length}
          icon={<TaskIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={APP_ROUTES.BOOKINGS}>
          <Button type="button" variant="outline" size="sm">
            All bookings
          </Button>
        </Link>
        <Link href={APP_ROUTES.WORKOUTS}>
          <Button type="button" variant="outline" size="sm">
            Workouts
          </Button>
        </Link>
        <Link href={APP_ROUTES.CALENDAR}>
          <Button type="button" variant="outline" size="sm">
            Calendar
          </Button>
        </Link>
      </div>

      <DashboardSection
        title="Trainers"
        description="Approved trainers on the platform. Expand for details, or book a session."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => void loadTrainers()}>
            Refresh list
          </Button>
        }
      >
        {trainers.length === 0 ? (
          <DashboardStateMessage variant="empty" message="No approved trainers found." />
        ) : (
          <ul className="space-y-4">
            {trainers.map((trainer) => (
              <li key={trainer.id}>
                <TrainerDirectoryCard
                  trainer={trainer}
                  isExpanded={expandedTrainerId === trainer.id}
                  onToggleExpand={() =>
                    setExpandedTrainerId((id) => (id === trainer.id ? null : trainer.id))
                  }
                  onBook={() => handleOpenBooking(trainer)}
                />
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Your booking status"
          action={
            <Link href={APP_ROUTES.BOOKINGS}>
              <Button type="button" variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          }
        >
          <BookingsTable bookings={bookingsPreview} perspective="trainee" />
        </DashboardSection>
        <DashboardSection
          title="Your workouts"
          action={
            <Link href={APP_ROUTES.WORKOUTS}>
              <Button type="button" variant="outline" size="sm">
                Open workouts
              </Button>
            </Link>
          }
        >
          <WorkoutsTable workouts={workouts} perspective="trainee" />
        </DashboardSection>
      </div>

      <CreateBookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBooking}
        trainer={bookingTrainer}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};
