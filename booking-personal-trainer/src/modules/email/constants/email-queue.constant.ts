/** BullMQ queue name for outbound email jobs. */
export const EMAIL_QUEUE_NAME = 'email' as const;

/** Job name used when enqueueing a send-mail payload. */
export const EMAIL_JOB_SEND = 'send' as const;
