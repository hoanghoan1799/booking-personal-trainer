jest.mock('resend', () => ({
  Resend: class Resend {
    public readonly emails: {
      send: jest.Mock;
    };
    constructor() {
      this.emails = {
        send: jest.fn(),
      };
    }
  },
}));

import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { ResendEmailSender } from '../resend-email.sender';

describe('ResendEmailSender', () => {
  it('should throw when RESEND_API_KEY is empty', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          ResendEmailSender,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: string) => {
                if (key === 'RESEND_API_KEY') return ' ';
                return defaultValue ?? '';
              }),
            },
          },
        ],
      }).compile(),
    ).rejects.toThrow('RESEND_API_KEY is required for ResendEmailSender');
  });

  it('should return null messageId when recipients are empty', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RESEND_API_KEY') return 'test-key';
              if (key === 'RESEND_FROM') return defaultValue ?? 'from@test.dev';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: ResendEmailSender = module.get(ResendEmailSender);

    const actual = await sender.send({
      to: ['   ', ''],
      subject: 'S',
      text: 'T',
      html: '<b>Hi</b>',
    });

    expect(actual.messageId).toBeNull();
  });

  it('should send via Resend and return messageId', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RESEND_API_KEY') return 'test-key';
              if (key === 'RESEND_FROM') return 'onboarding@resend.dev';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: ResendEmailSender = module.get(ResendEmailSender);
    const resendInstance = (
      sender as unknown as { resend: { emails: { send: jest.Mock } } }
    ).resend;
    resendInstance.emails.send.mockResolvedValue({
      data: { id: 'msg-1' },
      error: null,
    });

    const actual = await sender.send({
      to: 'user@test.com',
      subject: 'S',
      text: 'T',
      html: '<b>Hi</b>',
    });

    expect(actual.messageId).toBe('msg-1');
    expect(resendInstance.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'onboarding@resend.dev',
        to: ['user@test.com'],
        subject: 'S',
        text: 'T',
        html: '<b>Hi</b>',
      }),
    );
  });

  it('should omit html when input html is empty string', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RESEND_API_KEY') return 'test-key';
              if (key === 'RESEND_FROM') return 'onboarding@resend.dev';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: ResendEmailSender = module.get(ResendEmailSender);
    const resendInstance = (
      sender as unknown as { resend: { emails: { send: jest.Mock } } }
    ).resend;
    resendInstance.emails.send.mockResolvedValue({
      data: { id: 'msg-1' },
      error: null,
    });

    await sender.send({
      to: 'user@test.com',
      subject: 'S',
      text: 'T',
      html: '   ',
    });

    expect(resendInstance.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: undefined,
      }),
    );
  });

  it('should wrap Resend errors as InternalServerErrorException', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RESEND_API_KEY') return 'test-key';
              if (key === 'RESEND_FROM') return 'onboarding@resend.dev';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: ResendEmailSender = module.get(ResendEmailSender);
    const resendInstance = (
      sender as unknown as { resend: { emails: { send: jest.Mock } } }
    ).resend;
    resendInstance.emails.send.mockResolvedValue({
      data: null,
      error: { message: 'Unauthorized' },
    });

    await expect(
      sender.send({ to: 'user@test.com', subject: 'S', text: 'T' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should return null messageId when data.id is not a string', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RESEND_API_KEY') return 'test-key';
              if (key === 'RESEND_FROM') return 'onboarding@resend.dev';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: ResendEmailSender = module.get(ResendEmailSender);
    const resendInstance = (
      sender as unknown as { resend: { emails: { send: jest.Mock } } }
    ).resend;
    resendInstance.emails.send.mockResolvedValue({
      data: { id: 123 },
      error: null,
    });

    const actual = await sender.send({
      to: 'user@test.com',
      subject: 'S',
      text: 'T',
    });

    expect(actual.messageId).toBeNull();
  });

  it('should wrap non-Error failures as InternalServerErrorException', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RESEND_API_KEY') return 'test-key';
              if (key === 'RESEND_FROM') return 'onboarding@resend.dev';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: ResendEmailSender = module.get(ResendEmailSender);
    const resendInstance = (
      sender as unknown as { resend: { emails: { send: jest.Mock } } }
    ).resend;
    resendInstance.emails.send.mockRejectedValue('boom');

    await expect(
      sender.send({ to: 'user@test.com', subject: 'S', text: 'T' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
