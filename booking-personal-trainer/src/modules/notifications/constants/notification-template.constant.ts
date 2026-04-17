import { NotificationType } from '../enums/notification-type.enum';
import type { AuthProviderMethod } from '../../auth/types/auth-provider-method.type';

export type NotificationTemplate = {
  readonly title: string;
  readonly message: string;
};

type NewUserRegisteredProps = {
  readonly userName: string;
  readonly source?: AuthProviderMethod;
};

type BookingProps = {
  readonly traineeUserName: string;
  readonly trainerUserName: string;
};

type BookingRejectedProps = BookingProps & {
  readonly rejectionReason?: string | null;
};

type BookingCancelledProps = BookingProps & {
  readonly cancellationReason?: string | null;
};

type WorkoutCreatedProps = {
  readonly trainerUserName: string;
};

type RoleUpdatedProps = {
  readonly role: string;
};

type WorkoutPaidProps = {
  readonly traineeUserName: string;
};

export const NotificationTemplates = {
  adminNewUserRegistered: (
    props: NewUserRegisteredProps,
  ): NotificationTemplate => {
    const suffix = props.source === 'AUTH0' ? ' (Auth0)' : '';
    return {
      title: 'New user registered',
      message: `${props.userName} registered${suffix}`,
    };
  },

  adminTraineeBookedTrainer: (props: BookingProps): NotificationTemplate => ({
    title: 'New booking created',
    message: `${props.traineeUserName} booked trainer ${props.trainerUserName}`,
  }),

  trainerNewBooking: (props: BookingProps): NotificationTemplate => ({
    title: 'New booking request',
    message: `${props.traineeUserName} requested a booking`,
  }),

  traineeBookingApproved: (props: BookingProps): NotificationTemplate => ({
    title: 'Booking approved',
    message: `${props.trainerUserName} approved your booking`,
  }),

  traineeBookingRejected: (
    props: BookingRejectedProps,
  ): NotificationTemplate => {
    const reason =
      props.rejectionReason && props.rejectionReason.trim() !== ''
        ? ` Reason: ${props.rejectionReason.trim()}`
        : '';
    return {
      title: 'Booking rejected',
      message:
        `${props.trainerUserName} rejected your booking.${reason}`.trim(),
    };
  },

  traineeBookingCancelledByTrainer: (
    props: BookingCancelledProps,
  ): NotificationTemplate => {
    const reason =
      props.cancellationReason && props.cancellationReason.trim() !== ''
        ? ` Reason: ${props.cancellationReason.trim()}`
        : '';
    return {
      title: 'Booking cancelled',
      message:
        `${props.trainerUserName} cancelled your booking.${reason}`.trim(),
    };
  },

  trainerBookingCancelledByTrainee: (
    props: BookingCancelledProps,
  ): NotificationTemplate => {
    const reason =
      props.cancellationReason && props.cancellationReason.trim() !== ''
        ? ` Reason: ${props.cancellationReason.trim()}`
        : '';
    return {
      title: 'Booking cancelled',
      message:
        `${props.traineeUserName} cancelled the booking.${reason}`.trim(),
    };
  },

  traineeWorkoutCreated: (
    props: WorkoutCreatedProps,
  ): NotificationTemplate => ({
    title: 'New workout assigned',
    message: `${props.trainerUserName} created a workout for you`,
  }),

  userRoleUpdated: (props: RoleUpdatedProps): NotificationTemplate => ({
    title: 'Account role updated',
    message: `Your role was updated to ${props.role}`,
  }),

  trainerTraineePaidForWorkout: (
    props: WorkoutPaidProps,
  ): NotificationTemplate => ({
    title: 'Workout paid',
    message: `${props.traineeUserName} paid for a workout`,
  }),

  adminTraineePaidForWorkout: (
    props: WorkoutPaidProps,
  ): NotificationTemplate => ({
    title: 'Workout paid',
    message: `${props.traineeUserName} paid for a workout`,
  }),
} as const;

export const isNotificationTypeSupportedByTemplates = (
  type: NotificationType,
): boolean => {
  return Object.values(NotificationType).includes(type);
};
