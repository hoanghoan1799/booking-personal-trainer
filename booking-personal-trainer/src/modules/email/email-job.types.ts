/**
 * Serializable payload stored on the BullMQ job (worker sends via {@link EmailSender}).
 */
export type SendEmailJobPayload = {
  readonly to: readonly string[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string | null;
};
