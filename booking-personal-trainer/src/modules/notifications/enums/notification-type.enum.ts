export enum NotificationType {
  AdminNewUserRegistered = 'ADMIN_NEW_USER_REGISTERED',
  AdminTraineeBookedTrainer = 'ADMIN_TRAINEE_BOOKED_TRAINER',
  AdminTraineePaidForWorkout = 'ADMIN_TRAINEE_PAID_FOR_WORKOUT',
  TrainerNewBooking = 'TRAINER_NEW_BOOKING',
  TrainerBookingCancelledByTrainee = 'TRAINER_BOOKING_CANCELLED_BY_TRAINEE',
  TrainerTraineePaidForWorkout = 'TRAINER_TRAINEE_PAID_FOR_WORKOUT',
  TraineeBookingApproved = 'TRAINEE_BOOKING_APPROVED',
  TraineeBookingRejected = 'TRAINEE_BOOKING_REJECTED',
  TraineeBookingCancelledByTrainer = 'TRAINEE_BOOKING_CANCELLED_BY_TRAINER',
  TraineeWorkoutCreated = 'TRAINEE_WORKOUT_CREATED',
  UserRoleUpdated = 'USER_ROLE_UPDATED',
}
