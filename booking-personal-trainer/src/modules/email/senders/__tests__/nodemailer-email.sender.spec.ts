jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import nodemailer from 'nodemailer';
import { NodemailerEmailSender } from '../nodemailer-email.sender';

type CreateTransportMock = jest.Mock;

describe('NodemailerEmailSender', () => {
  const createTransportMock =
    nodemailer.createTransport as unknown as CreateTransportMock;

  beforeEach(() => {
    createTransportMock.mockReset();
  });

  it('should skip when recipients are empty after trim', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'EMAIL_SMTP_HOST') return 'smtp.test';
              if (key === 'EMAIL_SMTP_PASS') return 'pass';
              if (key === 'EMAIL_FROM_ADDRESS') return 'from@test.com';
              if (key === 'EMAIL_SMTP_USER') return 'user';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: NodemailerEmailSender = module.get(NodemailerEmailSender);

    const actual = await sender.send({
      to: ['  ', ''],
      subject: 'S',
      text: 'T',
      html: '<b>x</b>',
    });

    expect(actual.messageId).toBeNull();
  });

  it('should return null when transporter is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'EMAIL_SMTP_HOST') return '';
              if (key === 'EMAIL_SMTP_PASS') return '';
              if (key === 'EMAIL_FROM_ADDRESS') return '';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: NodemailerEmailSender = module.get(NodemailerEmailSender);

    const actual = await sender.send({
      to: 'a@test.com',
      subject: 'S',
      text: 'T',
      html: '<b>x</b>',
    });

    expect(actual.messageId).toBeNull();
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it('should create transporter and send mail', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'msg-1' });
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'EMAIL_SMTP_HOST') return 'smtp.test';
              if (key === 'EMAIL_SMTP_PORT') return '587';
              if (key === 'EMAIL_SMTP_SECURE') return 'true';
              if (key === 'EMAIL_SMTP_USER') return 'user';
              if (key === 'EMAIL_SMTP_PASS') return 'pass';
              if (key === 'EMAIL_FROM_NAME') return 'App';
              if (key === 'EMAIL_FROM_ADDRESS') return 'from@test.com';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: NodemailerEmailSender = module.get(NodemailerEmailSender);

    const actual = await sender.send({
      to: ['a@test.com', ' b@test.com '],
      subject: 'S',
      text: 'T',
      html: '<b>x</b>',
    });

    expect(actual.messageId).toBe('msg-1');
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test',
        port: 587,
        secure: true,
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['a@test.com', 'b@test.com'],
        subject: 'S',
        text: 'T',
      }),
    );
  });

  it('should use default port when EMAIL_SMTP_PORT is invalid and return null for non-string messageId', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 123 });
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'EMAIL_SMTP_HOST') return 'smtp.test';
              if (key === 'EMAIL_SMTP_PORT') return 'invalid';
              if (key === 'EMAIL_SMTP_SECURE') return 'false';
              if (key === 'EMAIL_SMTP_USER') return 'user';
              if (key === 'EMAIL_SMTP_PASS') return 'pass';
              if (key === 'EMAIL_FROM_NAME') return 'App';
              if (key === 'EMAIL_FROM_ADDRESS') return 'from@test.com';
              return defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();
    const sender: NodemailerEmailSender = module.get(NodemailerEmailSender);

    const actual = await sender.send({
      to: 'a@test.com',
      subject: 'S',
      text: 'T',
    });

    expect(actual.messageId).toBeNull();
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
      }),
    );
  });
});
