import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { StripeWebhookEvent } from '../decorators/stripe-webhook-event.decorator';
import { StripeWebhookSignatureGuard } from '../guards/stripe-webhook-signature.guard';
import { StripeWebhookService } from '../services/stripe-webhook.service';
import { PaymentsSwagger } from '../constants/payments-swagger.constants';
import type { StripeWebhookVerifiedSdkEvent } from '../types/stripe-webhook-http.types';

@ApiTags('Payments')
@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  @UseGuards(StripeWebhookSignatureGuard)
  @ApiOperation(PaymentsSwagger.Controller.StripeWebhook.ApiOperation.Webhook)
  @ApiResponse(PaymentsSwagger.Controller.StripeWebhook.ApiResponse.WebhookOk)
  async handleWebhook(
    @StripeWebhookEvent() event: StripeWebhookVerifiedSdkEvent,
  ): Promise<{ received: true }> {
    await this.stripeWebhookService.handleEvent(event);
    return { received: true };
  }
}
