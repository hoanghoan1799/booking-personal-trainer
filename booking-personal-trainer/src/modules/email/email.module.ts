import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { EMAIL_QUEUE_NAME } from './constants/email-queue.constant';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { EmailSenderToken } from './email.types';
import { NodemailerEmailSender } from './senders/nodemailer-email.sender';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
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
      useClass: NodemailerEmailSender,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
