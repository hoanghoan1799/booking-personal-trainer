"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GroupIcon, TaskIcon } from "@/icons";
import { APP_ROUTES } from "@/lib/route.constants";
import { useBookings } from "@/hooks/useBookings";
import { useWorkouts } from "@/hooks/useWorkouts";
import { getUsers } from "@/services/users/users.service";
import type { User } from "@/types/user.types";
import Button from "@/components/ui/button/Button";
import CreateBookingModal from "@/components/users/CreateBookingModal";
import { DashboardSection } from "./dashboard-section";
import { DashboardStatCard } from "./dashboard-stat-card";
import { DashboardStateMessage } from "./dashboard-state-message";
import { BookingsTable } from "./bookings-table";
import { WorkoutsTable } from "./workouts-table";
import { TrainerDirectoryCard } from "./trainer-directory-card";

const PREVIEW_BOOKINGS = 15;
const TRAINER_PAGE_SIZE = 80;

export const TraineeDashboard = (): React.ReactNode => {
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Trainee dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Find a trainer, create a booking, and track your sessions.
        </p>
      </div>

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
