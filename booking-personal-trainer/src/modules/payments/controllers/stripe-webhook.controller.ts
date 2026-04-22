import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import Stripe from 'stripe';

// Shared
import { StripeService } from '../../../shared/stripe/stripe.service';

// Services
import { StripeWebhookService } from '../services/stripe-webhook.service';

type StripeWebhookRequest = Request & { rawBody?: Buffer };

@ApiTags('Payments')
@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeWebhookService: StripeWebhookService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description: 'Receives Stripe events and synchronizes payment state.',
  })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async handleWebhook(
    @Req() req: StripeWebhookRequest,
    @Body() _ignoredBody: unknown,
    @Headers('stripe-signature') signatureHeader: string | undefined,
  ): Promise<{ received: true }> {
    const stripeWebhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    if (!stripeWebhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!signatureHeader) {
      throw new Error('Missing Stripe signature header');
    }
    const rawBody: Buffer | undefined = req.rawBody;
    if (!rawBody) {
      throw new Error('Missing raw body for Stripe webhook verification');
    }
    const stripeClient: InstanceType<typeof Stripe> =
      this.stripeService.getClient();
    const event = stripeClient.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      stripeWebhookSecret,
    );
    await this.stripeWebhookService.handleEvent(event);
    return { received: true };
  }
}
