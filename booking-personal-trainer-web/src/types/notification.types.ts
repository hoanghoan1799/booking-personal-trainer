export type NotificationType =
  | "ADMIN_TRAINER_ROLE_REQUESTED"
  | "ADMIN_NEW_USER_REGISTERED"
  | "ADMIN_TRAINEE_BOOKED_TRAINER"
  | "ADMIN_TRAINEE_PAID_FOR_WORKOUT"
  | "TRAINER_NEW_BOOKING"
  | "TRAINER_BOOKING_CANCELLED_BY_TRAINEE"
  | "TRAINER_TRAINEE_PAID_FOR_WORKOUT"
  | "TRAINEE_BOOKING_APPROVED"
  | "TRAINEE_BOOKING_REJECTED"
  | "TRAINEE_BOOKING_CANCELLED_BY_TRAINER"
  | "TRAINEE_WORKOUT_CREATED"
  | "USER_ROLE_UPDATED";

export type Notification = {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data?: Record<string, unknown> | null;
  readonly isRead: boolean;
  readonly createdAt?: string;
};

