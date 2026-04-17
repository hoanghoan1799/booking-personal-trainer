import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type {
  EmailSender,
  EmailTransportResult,
  SendEmailInput,
} from '../email.types';

type ResendConfig = {
  readonly apiKey: string;
  readonly from: string;
};

const DEFAULT_RESEND_FROM: string = 'onboarding@resend.dev';

@Injectable()
export class ResendEmailSender implements EmailSender {
  private readonly logger: Logger = new Logger(ResendEmailSender.name);
  private readonly resend: Resend;
  private readonly config: ResendConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadResendConfig();
    this.resend = new Resend(this.config.apiKey);
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
    try {
      const html: string | undefined =
        input.html != null && input.html.trim() !== '' ? input.html : undefined;
      const { data, error } = await this.resend.emails.send({
        from: this.config.from,
        to: [...to],
        subject: input.subject,
        text: input.text,
        html,
      });
      if (error) {
        throw new Error(error.message);
      }
      const messageId: string | null =
        data && typeof data.id === 'string' ? data.id : null;
      return { messageId };
    } catch (err: unknown) {
      const message: string =
        err instanceof Error ? err.message : 'Unknown Resend error';
      this.logger.error(`Resend send failed: ${message}`);
      throw new InternalServerErrorException(
        `Failed to send email: ${message}`,
        {
          cause: err,
        },
      );
    }
  }

  private loadResendConfig(): ResendConfig {
    const apiKey: string = this.configService.get<string>('RESEND_API_KEY', '');
    if (apiKey.trim() === '') {
      throw new Error('RESEND_API_KEY is required for ResendEmailSender');
    }
    const from: string = this.configService.get<string>(
      'RESEND_FROM',
      DEFAULT_RESEND_FROM,
    );
    return { apiKey, from };
  }
}
