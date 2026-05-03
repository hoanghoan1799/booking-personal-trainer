import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class StripeWebhookRawBodyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const rawBody: unknown = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      throw new BadRequestException(
        'Missing raw body for Stripe webhook verification',
      );
    }
    next();
  }
}
