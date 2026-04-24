import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { EMAIL_QUEUE_NAME } from './constants/email-queue.constant';
import { EmailProcessor } from './workers/email.processor';
import { EmailService } from './services/email.service';
import { EmailSenderToken } from './types/email.types';
import { ResendEmailSender } from './senders/resend-email.sender';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
      /** Ensure Redis is disconnected when the Nest app shuts down (avoids Jest "open handles" in e2e). */
      forceDisconnectOnShutdown: true,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 1000,
        removeOnFail: false,
      },
    }),
  ],
  providers: [
    EmailService,
    EmailProcessor,
    {
      provide: EmailSenderToken,
      useClass: ResendEmailSender,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
