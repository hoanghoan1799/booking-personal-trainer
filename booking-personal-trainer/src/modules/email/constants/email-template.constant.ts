import type { AuthProviderMethod } from '../../auth/types/auth-provider-method.type';

export type EmailTemplate = {
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
};

type NewUserRegisteredProps = {
  readonly userName: string;
  readonly userEmail: string;
  readonly registeredAt: Date;
  readonly userUrl: string;
  readonly authProvider: AuthProviderMethod;
  readonly source?: AuthProviderMethod;
};

type BookingProps = {
  readonly traineeName: string;
  readonly trainerName: string;
  readonly bookingTime: string;
  readonly bookingUrl: string;
};

type BookingRejectedProps = BookingProps & {
  readonly rejectionReason?: string | null;
};

type BookingCancelledProps = BookingProps & {
  readonly cancellationReason?: string | null;
};

type WorkoutCreatedProps = {
  readonly traineeName: string;
  readonly trainerName: string;
  readonly workoutTitle: string;
  readonly workoutUrl: string;
};

type RoleUpdatedProps = {
  readonly userName: string;
  readonly newRole: string;
  readonly profileUrl: string;
};

type WorkoutPaidProps = {
  readonly traineeName: string;
  readonly trainerName: string;
  readonly amount: string;
  readonly workoutTitle: string;
  readonly paidAt: string;
  readonly paymentUrl: string;
};

const buildOptionalReasonValue = (reason?: string | null): string => {
  const trimmedReason: string = reason?.trim() ?? '';
  return trimmedReason === '' ? 'Not provided' : trimmedReason;
};

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

export const EmailTemplates = {
  adminNewUserRegistered: (props: NewUserRegisteredProps): EmailTemplate => {
    const suffix: string = props.source === 'AUTH0' ? ' (Auth0)' : '';
    const subject: string = `New user registered${suffix}`;
    const registeredAtText: string = props.registeredAt.toISOString();
    const safeUserName: string = escapeHtml(props.userName);
    const safeUserEmail: string = escapeHtml(props.userEmail);
    const safeUserUrl: string = escapeHtml(props.userUrl);
    const text: string = [
      'Hi Admin,',
      '',
      'A new user has registered on the platform.',
      '',
      'User Info',
      `- Name: ${props.userName}`,
      `- Email: ${props.userEmail}`,
      `- Method: ${props.authProvider}`,
      `- Time: ${registeredAtText}`,
      '',
      `View User: ${props.userUrl}`,
      '',
      '— System',
    ].join('\n');
    const year: number = new Date().getFullYear();
    const html: string = `<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New User Registration</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

          <tr>
            <td style="background-color:#4f46e5; padding:20px; text-align:center;">
              <span style="color:#ffffff; font-size:18px; font-weight:bold;">
                🚀 Your Platform
              </span>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; color:#111827;">

              <h2 style="margin:0 0 12px 0; font-size:20px;">
                New User Registered
              </h2>

              <p style="margin:0 0 24px 0; color:#6b7280; font-size:14px;">
                A new user has just signed up on your platform. Here are the details:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px; padding:16px;">
                <tr>
                  <td style="padding:8px 0; font-size:14px;">
                    <strong>Name:</strong> ${safeUserName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:14px;">
                    <strong>Email:</strong> ${safeUserEmail}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:14px;">
                    <strong>Registered At:</strong> ${registeredAtText}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:14px;">
                    <strong>Method:</strong> ${escapeHtml(props.authProvider)}
                  </td>
                </tr>
              </table>

              <div style="text-align:center; margin:32px 0;">
                <a href="${safeUserUrl}"
                   style="
                     background-color:#4f46e5;
                     color:#ffffff;
                     padding:14px 24px;
                     text-decoration:none;
                     border-radius:8px;
                     font-size:14px;
                     font-weight:600;
                     display:inline-block;
                   ">
                  View User Details
                </a>
              </div>

              <p style="font-size:12px; color:#9ca3af; margin-top:24px;">
                If the button above doesn’t work, copy and paste this link into your browser:
              </p>
              <p style="word-break:break-all; font-size:12px; color:#4f46e5;">
                ${safeUserUrl}
              </p>

            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#9ca3af;">
              © ${year} Your Platform. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
    return { subject, text, html };
  },

  adminTraineeBookedTrainer: (props: BookingProps): EmailTemplate => ({
    subject: 'New booking created',
    text: [
      'Hi Admin,',
      '',
      'A new booking request has been created.',
      '',
      'Booking Info',
      `- Trainee: ${props.traineeName}`,
      `- Trainer: ${props.trainerName}`,
      `- Time: ${props.bookingTime}`,
      '',
      `View Booking: ${props.bookingUrl}`,
      '',
      '— System',
    ].join('\n'),
    html: [
      `<p>Hi Admin,</p>`,
      `<p>A new booking request has been created.</p>`,
      `<p><strong>Booking Info</strong></p>`,
      `<ul>`,
      `<li><strong>Trainee:</strong> ${escapeHtml(props.traineeName)}</li>`,
      `<li><strong>Trainer:</strong> ${escapeHtml(props.trainerName)}</li>`,
      `<li><strong>Time:</strong> ${escapeHtml(props.bookingTime)}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${escapeHtml(props.bookingUrl)}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Booking`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${escapeHtml(props.bookingUrl)}</p>`,
      `<p>— System</p>`,
    ].join(''),
  }),

  trainerNewBooking: (props: BookingProps): EmailTemplate => {
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeBookingTime: string = escapeHtml(props.bookingTime);
    const safeBookingUrl: string = escapeHtml(props.bookingUrl);
    const subject: string = 'New booking created';
    const text: string = [
      `Hi ${props.trainerName},`,
      '',
      'You have a new booking request.',
      '',
      'Booking Info',
      `- Trainee: ${props.traineeName}`,
      `- Time: ${props.bookingTime}`,
      `- Note: Not provided`,
      '',
      `Review Booking: ${props.bookingUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTrainerName},</p>`,
      `<p>You have a new booking request.</p>`,
      `<p><strong>Booking Info</strong></p>`,
      `<ul>`,
      `<li><strong>Trainee:</strong> ${safeTraineeName}</li>`,
      `<li><strong>Time:</strong> ${safeBookingTime}</li>`,
      `<li><strong>Note:</strong> Not provided</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeBookingUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    Review Booking`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeBookingUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  traineeNewBookingRequestCreated: (props: BookingProps): EmailTemplate => {
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeBookingTime: string = escapeHtml(props.bookingTime);
    const safeBookingUrl: string = escapeHtml(props.bookingUrl);
    const subject: string = 'New booking request created';
    const text: string = [
      `Hi ${props.traineeName},`,
      '',
      'Your booking request has been submitted.',
      '',
      'Details',
      `- Trainer: ${props.trainerName}`,
      `- Time: ${props.bookingTime}`,
      '',
      'Please wait for trainer approval.',
      '',
      `View Booking: ${props.bookingUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTraineeName},</p>`,
      `<p>Your booking request has been submitted.</p>`,
      `<p><strong>Details</strong></p>`,
      `<ul>`,
      `<li><strong>Trainer:</strong> ${safeTrainerName}</li>`,
      `<li><strong>Time:</strong> ${safeBookingTime}</li>`,
      `</ul>`,
      `<p>Please wait for trainer approval.</p>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeBookingUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Booking`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeBookingUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  traineeBookingApproved: (props: BookingProps): EmailTemplate => {
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeBookingTime: string = escapeHtml(props.bookingTime);
    const safeBookingUrl: string = escapeHtml(props.bookingUrl);
    const subject: string = 'Booking approved';
    const text: string = [
      `Hi ${props.traineeName},`,
      '',
      'Your booking has been approved 🎉',
      '',
      'Details',
      `- Trainer: ${props.trainerName}`,
      `- Time: ${props.bookingTime}`,
      '',
      `View Details: ${props.bookingUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTraineeName},</p>`,
      `<p>Your booking has been approved 🎉</p>`,
      `<p><strong>Details</strong></p>`,
      `<ul>`,
      `<li><strong>Trainer:</strong> ${safeTrainerName}</li>`,
      `<li><strong>Time:</strong> ${safeBookingTime}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeBookingUrl}" style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Details`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeBookingUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  traineeBookingRejected: (props: BookingRejectedProps): EmailTemplate => {
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeBookingTime: string = escapeHtml(props.bookingTime);
    const safeBookingUrl: string = escapeHtml(props.bookingUrl);
    const reason: string = buildOptionalReasonValue(props.rejectionReason);
    const safeReason: string = escapeHtml(reason);
    const subject: string = 'Booking rejected';
    const text: string = [
      `Hi ${props.traineeName},`,
      '',
      'Unfortunately, your booking was rejected.',
      '',
      'Details',
      `- Trainer: ${props.trainerName}`,
      `- Time: ${props.bookingTime}`,
      `- Reason: ${reason}`,
      '',
      `View Booking: ${props.bookingUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTraineeName},</p>`,
      `<p>Unfortunately, your booking was rejected.</p>`,
      `<p><strong>Details</strong></p>`,
      `<ul>`,
      `<li><strong>Trainer:</strong> ${safeTrainerName}</li>`,
      `<li><strong>Time:</strong> ${safeBookingTime}</li>`,
      `<li><strong>Reason:</strong> ${safeReason}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeBookingUrl}" style="background:#ef4444;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Booking`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeBookingUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  traineeBookingCancelledByTrainer: (
    props: BookingCancelledProps,
  ): EmailTemplate => {
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeBookingTime: string = escapeHtml(props.bookingTime);
    const safeBookingUrl: string = escapeHtml(props.bookingUrl);
    const reason: string = buildOptionalReasonValue(props.cancellationReason);
    const safeReason: string = escapeHtml(reason);
    const subject: string = 'Booking cancelled';
    const text: string = [
      `Hi ${props.traineeName},`,
      '',
      'Your booking has been cancelled by the trainer.',
      '',
      'Details',
      `- Trainer: ${props.trainerName}`,
      `- Time: ${props.bookingTime}`,
      `- Reason: ${reason}`,
      '',
      `View Booking: ${props.bookingUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTraineeName},</p>`,
      `<p>Your booking has been cancelled by the trainer.</p>`,
      `<p><strong>Details</strong></p>`,
      `<ul>`,
      `<li><strong>Trainer:</strong> ${safeTrainerName}</li>`,
      `<li><strong>Time:</strong> ${safeBookingTime}</li>`,
      `<li><strong>Reason:</strong> ${safeReason}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeBookingUrl}" style="background:#ef4444;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Booking`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeBookingUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  trainerBookingCancelledByTrainee: (
    props: BookingCancelledProps,
  ): EmailTemplate => {
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeBookingTime: string = escapeHtml(props.bookingTime);
    const safeBookingUrl: string = escapeHtml(props.bookingUrl);
    const subject: string = 'Booking cancelled';
    const text: string = [
      `Hi ${props.trainerName},`,
      '',
      'A trainee has cancelled a booking.',
      '',
      'Details',
      `- Trainee: ${props.traineeName}`,
      `- Time: ${props.bookingTime}`,
      '',
      `View Booking: ${props.bookingUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTrainerName},</p>`,
      `<p>A trainee has cancelled a booking.</p>`,
      `<p><strong>Details</strong></p>`,
      `<ul>`,
      `<li><strong>Trainee:</strong> ${safeTraineeName}</li>`,
      `<li><strong>Time:</strong> ${safeBookingTime}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeBookingUrl}" style="background:#ef4444;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Booking`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeBookingUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  traineeWorkoutCreated: (props: WorkoutCreatedProps): EmailTemplate => {
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeWorkoutTitle: string = escapeHtml(props.workoutTitle);
    const safeWorkoutUrl: string = escapeHtml(props.workoutUrl);
    const subject: string = 'New workout assigned';
    const text: string = [
      `Hi ${props.traineeName},`,
      '',
      'A new workout has been assigned to you.',
      '',
      'Workout',
      `- Title: ${props.workoutTitle}`,
      `- Trainer: ${props.trainerName}`,
      '',
      `View Workout: ${props.workoutUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeTraineeName},</p>`,
      `<p>A new workout has been assigned to you.</p>`,
      `<p><strong>Workout</strong></p>`,
      `<ul>`,
      `<li><strong>Title:</strong> ${safeWorkoutTitle}</li>`,
      `<li><strong>Trainer:</strong> ${safeTrainerName}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeWorkoutUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Workout`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeWorkoutUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  userRoleUpdated: (props: RoleUpdatedProps): EmailTemplate => {
    const safeUserName: string = escapeHtml(props.userName);
    const safeNewRole: string = escapeHtml(props.newRole);
    const safeProfileUrl: string = escapeHtml(props.profileUrl);
    const subject: string = 'Account role updated';
    const text: string = [
      `Hi ${props.userName},`,
      '',
      'Your account role has been updated.',
      '',
      `New Role: ${props.newRole}`,
      '',
      'If you have any questions, please contact support.',
      '',
      `View Profile: ${props.profileUrl}`,
    ].join('\n');
    const html: string = [
      `<p>Hi ${safeUserName},</p>`,
      `<p>Your account role has been updated.</p>`,
      `<p><strong>New Role:</strong> ${safeNewRole}</p>`,
      `<p>If you have any questions, please contact support.</p>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safeProfileUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Profile`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safeProfileUrl}</p>`,
    ].join('');
    return { subject, text, html };
  },

  trainerTraineePaidForWorkout: (props: WorkoutPaidProps): EmailTemplate => ({
    subject: 'Workout paid',
    text: `${props.traineeName} paid for a workout. ${props.paymentUrl}`,
  }),

  adminTraineePaidForWorkout: (props: WorkoutPaidProps): EmailTemplate => {
    const safeTraineeName: string = escapeHtml(props.traineeName);
    const safeTrainerName: string = escapeHtml(props.trainerName);
    const safeAmount: string = escapeHtml(props.amount);
    const safeWorkoutTitle: string = escapeHtml(props.workoutTitle);
    const safePaidAt: string = escapeHtml(props.paidAt);
    const safePaymentUrl: string = escapeHtml(props.paymentUrl);
    const subject: string = 'Workout paid';
    const text: string = [
      'Hi Admin,',
      '',
      'A trainee has completed a payment.',
      '',
      'Payment Details',
      `- Trainee: ${props.traineeName}`,
      `- Trainer: ${props.trainerName}`,
      `- Amount: ${props.amount}`,
      `- Workout: ${props.workoutTitle}`,
      `- Paid At: ${props.paidAt}`,
      '',
      `View Payment: ${props.paymentUrl}`,
      '',
      '— System',
    ].join('\n');
    const html: string = [
      `<p>Hi Admin,</p>`,
      `<p>A trainee has completed a payment.</p>`,
      `<p><strong>Payment Details</strong></p>`,
      `<ul>`,
      `<li><strong>Trainee:</strong> ${safeTraineeName}</li>`,
      `<li><strong>Trainer:</strong> ${safeTrainerName}</li>`,
      `<li><strong>Amount:</strong> ${safeAmount}</li>`,
      `<li><strong>Workout:</strong> ${safeWorkoutTitle}</li>`,
      `<li><strong>Paid At:</strong> ${safePaidAt}</li>`,
      `</ul>`,
      `<div style="margin:24px 0;text-align:center;">`,
      `  <a href="${safePaymentUrl}" style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">`,
      `    View Payment`,
      `  </a>`,
      `</div>`,
      `<p style="word-break:break-all;">${safePaymentUrl}</p>`,
      `<p>— System</p>`,
    ].join('');
    return { subject, text, html };
  },
} as const;
