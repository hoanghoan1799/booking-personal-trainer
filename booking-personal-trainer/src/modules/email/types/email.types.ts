import type { InjectionToken } from '@nestjs/common';

export type SendEmailInput = {
  readonly to: string | readonly string[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string | null;
};

/** Result of the actual SMTP/API send (used by the BullMQ worker). */
export type EmailTransportResult = {
  readonly messageId: string | null;
};

/** Result of {@link EmailService.send} when mail is enqueued for async delivery. */
export type SendEmailResult = {
  readonly jobId: string | null;
};

/**
 * Infrastructure-agnostic email sender contract.
 * Swap implementations (Nodemailer, SES, SendGrid, etc.) without changing callers.
 */
export interface EmailSender {
  send(input: SendEmailInput): Promise<EmailTransportResult>;
}

export const EmailSenderToken: InjectionToken<EmailSender> =
  'EmailSender' as unknown as InjectionToken<EmailSender>;
