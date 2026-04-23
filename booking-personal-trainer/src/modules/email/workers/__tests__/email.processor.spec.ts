import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';

import { EmailProcessor } from '../email.processor';
import { EmailSenderToken } from '../../types/email.types';
import type { SendEmailJobPayload } from '../../types/email-job.types';

describe('EmailProcessor', () => {
  it('should send email using sender with job payload', async () => {
    const emailSender = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailSenderToken,
          useValue: emailSender,
        },
      ],
    }).compile();
    const processor: EmailProcessor = module.get(EmailProcessor);

    const job = {
      id: 'job-1',
      data: {
        to: ['a@test.com', 'b@test.com'],
        subject: 'S',
        text: 'T',
        html: null,
      },
    } as unknown as Job<SendEmailJobPayload>;
    await processor.process(job);

    expect(emailSender.send).toHaveBeenCalledWith({
      to: ['a@test.com', 'b@test.com'],
      subject: 'S',
      text: 'T',
      html: null,
    });
  });

  it('should handle single recipient string and null messageId', async () => {
    const emailSender = {
      send: jest.fn().mockResolvedValue({ messageId: null }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailSenderToken,
          useValue: emailSender,
        },
      ],
    }).compile();
    const processor: EmailProcessor = module.get(EmailProcessor);

    const job = {
      id: 123,
      data: {
        to: 'a@test.com',
        subject: 'S',
        text: 'T',
        html: null,
      },
    } as unknown as Job<SendEmailJobPayload>;
    await processor.process(job);

    expect(emailSender.send).toHaveBeenCalledWith({
      to: 'a@test.com',
      subject: 'S',
      text: 'T',
      html: null,
    });
  });

  it('should rethrow sender errors', async () => {
    const emailSender = {
      send: jest.fn().mockRejectedValue(new Error('send failed')),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailSenderToken,
          useValue: emailSender,
        },
      ],
    }).compile();
    const processor: EmailProcessor = module.get(EmailProcessor);

    const job = {
      id: 123,
      data: {
        to: 'a@test.com',
        subject: 'S',
        text: 'T',
        html: '<b>x</b>',
      },
    } as unknown as Job<SendEmailJobPayload>;
    await expect(processor.process(job)).rejects.toThrow('send failed');
  });

  it('should rethrow non-Error sender failures', async () => {
    const emailSender = {
      send: jest.fn().mockRejectedValue('boom'),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailSenderToken,
          useValue: emailSender,
        },
      ],
    }).compile();
    const processor: EmailProcessor = module.get(EmailProcessor);

    const job = {
      id: 'job-1',
      data: {
        to: 'a@test.com',
        subject: 'S',
        text: 'T',
        html: null,
      },
    } as unknown as Job<SendEmailJobPayload>;
    await expect(processor.process(job)).rejects.toBe('boom');
  });
});
