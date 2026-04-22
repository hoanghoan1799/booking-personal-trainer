import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import {
  type EmailSender,
  type EmailTransportResult,
  type SendEmailInput,
} from '../types/email.types';

type SmtpConfig = {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly pass: string;
};

type FromConfig = {
  readonly name: string;
  readonly address: string;
};

const DEFAULT_SMTP_PORT: number = 587;
const TRUE_STRING: string = 'true';

@Injectable()
export class NodemailerEmailSender implements EmailSender {
  private readonly logger: Logger = new Logger(NodemailerEmailSender.name);
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo> | null;
  private readonly from: FromConfig;

  constructor(private readonly configService: ConfigService) {
    const smtp: SmtpConfig = this.loadSmtpConfig();
    this.from = this.loadFromConfig();
    const isConfigured: boolean =
      smtp.host.trim() !== '' &&
      smtp.pass.trim() !== '' &&
      this.from.address.trim() !== '';
    if (!isConfigured) {
      this.logger.warn(
        'SMTP email is disabled until EMAIL_SMTP_HOST, EMAIL_SMTP_PASS, and EMAIL_FROM_ADDRESS are set.',
      );
      this.transporter = null;
      return;
    }
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  }

  public async send(input: SendEmailInput): Promise<EmailTransportResult> {
    const recipients: readonly string[] = Array.isArray(input.to)
      ? input.to
      : [input.to];
    const to: readonly string[] = recipients
      .map((value) => value.trim())
      .filter((value) => value !== '');
    if (to.length === 0) {
      return { messageId: null };
    }
    if (!this.transporter) {
      this.logger.warn('Skipping email send: SMTP is not configured.');
      return { messageId: null };
    }
    const toAddresses: string[] = [...to];
    const info = await this.transporter.sendMail({
      from: { name: this.from.name, address: this.from.address },
      to: toAddresses,
      subject: input.subject,
      text: input.text,
      html: input.html ?? undefined,
    });
    const messageId: string | null =
      typeof info.messageId === 'string' ? info.messageId : null;
    return { messageId };
  }

  private loadSmtpConfig(): SmtpConfig {
    const host: string = this.configService.get<string>('EMAIL_SMTP_HOST', '');
    const rawPort: string = this.configService.get<string>(
      'EMAIL_SMTP_PORT',
      String(DEFAULT_SMTP_PORT),
    );
    const parsedPort: number = Number.parseInt(rawPort, 10);
    const port: number = Number.isFinite(parsedPort)
      ? parsedPort
      : DEFAULT_SMTP_PORT;
    const rawSecure: string = this.configService.get<string>(
      'EMAIL_SMTP_SECURE',
      'false',
    );
    const secure: boolean = rawSecure.trim().toLowerCase() === TRUE_STRING;
    const user: string = this.configService.get<string>('EMAIL_SMTP_USER', '');
    const pass: string = this.configService.get<string>('EMAIL_SMTP_PASS', '');
    return { host, port, secure, user, pass };
  }

  private loadFromConfig(): FromConfig {
    const name: string = this.configService.get<string>('EMAIL_FROM_NAME', '');
    const address: string = this.configService.get<string>(
      'EMAIL_FROM_ADDRESS',
      '',
    );
    return { name, address };
  }
}
