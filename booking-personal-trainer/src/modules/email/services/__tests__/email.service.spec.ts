import { InternalServerErrorException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { EMAIL_QUEUE_NAME } from '../../constants/email-queue.constant';
import { EmailService } from '../email.service';

describe('EmailService', () => {
  it('should not enqueue when all recipients are empty after trim', async () => {
    const emailQueue: { add: jest.Mock } = {
      add: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
      ],
    }).compile();
    const service: EmailService = module.get<EmailService>(EmailService);
    const actual = await service.send({
      to: ['  ', ''],
      subject: 'Subject',
      text: 'Body',
    });
    expect(actual.jobId).toBeNull();
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('should enqueue a job and return jobId', async () => {
    const emailQueue: { add: jest.Mock } = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
      ],
    }).compile();
    const service: EmailService = module.get<EmailService>(EmailService);
    const actual = await service.send({
      to: 'user@test.com',
      subject: 'S',
      text: 'T',
    });
    expect(actual.jobId).toBe('job-1');
    expect(emailQueue.add).toHaveBeenCalled();
  });

  it('should coerce numeric job id to string', async () => {
    const emailQueue: { add: jest.Mock } = {
      add: jest.fn().mockResolvedValue({ id: 123 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
      ],
    }).compile();
    const service: EmailService = module.get<EmailService>(EmailService);

    const actual = await service.send({
      to: [' user@test.com '],
      subject: 'S',
      text: 'T',
      html: undefined,
    });

    expect(actual.jobId).toBe('123');
  });

  it('should return null jobId when job.id is missing', async () => {
    const emailQueue: { add: jest.Mock } = {
      add: jest.fn().mockResolvedValue({}),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
      ],
    }).compile();
    const service: EmailService = module.get<EmailService>(EmailService);

    const actual = await service.send({
      to: 'user@test.com',
      subject: 'S',
      text: 'T',
    });

    expect(actual.jobId).toBeNull();
  });

  it('should wrap queue failures as InternalServerErrorException', async () => {
    const emailQueue: { add: jest.Mock } = {
      add: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
      ],
    }).compile();
    const service: EmailService = module.get<EmailService>(EmailService);
    await expect(
      service.send({ to: 'user@test.com', subject: 'S', text: 'T' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should wrap non-Error queue failures with unknown message', async () => {
    const emailQueue: { add: jest.Mock } = {
      add: jest.fn().mockRejectedValue('boom'),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
      ],
    }).compile();
    const service: EmailService = module.get<EmailService>(EmailService);

    await expect(
      service.send({ to: 'user@test.com', subject: 'S', text: 'T' }),
    ).rejects.toThrow('Failed to enqueue email: Unknown email queue error');
  });
});
