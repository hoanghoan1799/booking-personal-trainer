import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { EMAIL_QUEUE_NAME } from './constants/email-queue.constant';
import type { SendEmailJobPayload } from './email-job.types';
import { EmailSenderToken, type EmailSender } from './email.types';

/**
 * BullMQ worker: consumes email jobs and performs the real send via {@link EmailSender}.
 */
@Processor(EMAIL_QUEUE_NAME, { concurrency: 5 })
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject(EmailSenderToken) private readonly emailSender: EmailSender,
  ) {
    super();
  }

  public async process(job: Job<SendEmailJobPayload>): Promise<void> {
    try {
      const recipientCount: number = Array.isArray(job.data.to)
        ? job.data.to.length
        : 1;
      this.logger.log(
        `Processing email job id=${String(job.id)} recipients=${recipientCount} subject="${job.data.subject}"`,
      );
      const { messageId } = await this.emailSender.send({
        to: job.data.to,
        subject: job.data.subject,
        text: job.data.text,
        html: job.data.html ?? null,
      });
      this.logger.log(
        `Email job completed id=${String(job.id)} messageId=${messageId ?? 'null'}`,
      );
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : String(err);
      const stack: string | undefined =
        err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Email job failed id=${String(job.id)}: ${message}`,
        stack,
      );
      throw err;
    }
  }
}
