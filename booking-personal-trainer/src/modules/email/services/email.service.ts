import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import {
  EMAIL_JOB_SEND,
  EMAIL_QUEUE_NAME,
} from '../constants/email-queue.constant';
import type { SendEmailJobPayload } from '../types/email-job.types';
import {
  type SendEmailInput,
  type SendEmailResult,
} from '../types/email.types';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<SendEmailJobPayload>,
  ) {}

  public async send(input: SendEmailInput): Promise<SendEmailResult> {
    const recipients: readonly string[] = Array.isArray(input.to)
      ? input.to
      : [input.to];
    const normalizedRecipients: readonly string[] = recipients
      .map((value) => value.trim())
      .filter((value) => value !== '');
    if (normalizedRecipients.length === 0) {
      return { jobId: null };
    }
    const payload: SendEmailJobPayload = {
      to: normalizedRecipients,
      subject: input.subject,
      text: input.text,
      html: input.html ?? null,
    };
    try {
      const job = await this.emailQueue.add(EMAIL_JOB_SEND, payload);
      const jobId: string | null =
        typeof job.id === 'string'
          ? job.id
          : job.id != null
            ? String(job.id)
            : null;
      return { jobId };
    } catch (err: unknown) {
      const message: string =
        err instanceof Error
          ? err.message
          : ERROR_MESSAGES.QUEUE.UNKNOWN_EMAIL_QUEUE_ERROR;
      throw new InternalServerErrorException(
        `${ERROR_MESSAGES.QUEUE.FAILED_EMAIL_QUEUE}: ${message}`,
        { cause: err },
      );
    }
  }
}
