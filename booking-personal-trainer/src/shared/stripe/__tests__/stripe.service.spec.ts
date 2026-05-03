import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { StripeService } from '../stripe.service';

/** Spec-only stubs: keep ESLint typed without pulling Stripe `InstanceType` (resolves to TS `error` here). */
type StripeWebhookConstructedEventFixture = Readonly<{
  id: string;
  readonly object?: string;
  readonly type?: string;
}>;

type StripeWebhookSdkFixture = Readonly<{
  webhooks: Readonly<{
    constructEvent(
      rawBody: Buffer,
      stripeSignatureHeader: string,
      webhookSecret: string,
    ): StripeWebhookConstructedEventFixture;
  }>;
}>;

type StripeWebhookMethodHost = Readonly<{
  constructWebhookEvent(
    rawBody: Buffer,
    stripeSignatureHeader: string,
  ): StripeWebhookConstructedEventFixture;
}>;

const asStripeWebhookMethodHost = (
  stripeService: StripeService,
): StripeWebhookMethodHost =>
  stripeService as unknown as StripeWebhookMethodHost;

describe('StripeService', () => {
  let moduleRef: TestingModule;
  let service: StripeService;
  let configGetOrThrow: jest.MockedFunction<(key: string) => string>;

  beforeEach(async () => {
    configGetOrThrow = jest.fn((key: string): string => {
      if (key === 'STRIPE_SECRET_KEY') {
        return 'sk_test_12345678901234567890123456789012';
      }
      if (key === 'STRIPE_WEBHOOK_SECRET') {
        return 'whsec_12345678901234567890123456789012';
      }
      throw new Error(`unexpected config key: ${key}`);
    });
    moduleRef = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: configGetOrThrow },
        },
      ],
    }).compile();
    service = moduleRef.get(StripeService);
  });

  afterEach(async (): Promise<void> => {
    await moduleRef.close();
  });

  describe('constructWebhookEvent', () => {
    it('returns the event constructed by Stripe', () => {
      const webhookSdk: StripeWebhookSdkFixture =
        service.getClient() as unknown as StripeWebhookSdkFixture;
      const mockEvent: StripeWebhookConstructedEventFixture = {
        id: 'evt_unit',
        object: 'event',
        type: 'payment_intent.succeeded',
      };
      const constructSpy = jest
        .spyOn(webhookSdk.webhooks, 'constructEvent')
        .mockReturnValue(mockEvent);
      const rawBody: Buffer = Buffer.from(JSON.stringify({ x: true }));
      const signatureHeader = 'sig_header_unit';

      const actual: StripeWebhookConstructedEventFixture =
        asStripeWebhookMethodHost(service).constructWebhookEvent(
          rawBody,
          signatureHeader,
        );

      expect(actual).toBe(mockEvent);
      expect(configGetOrThrow).toHaveBeenCalledWith('STRIPE_WEBHOOK_SECRET');
      expect(constructSpy).toHaveBeenCalledWith(
        rawBody,
        signatureHeader,
        'whsec_12345678901234567890123456789012',
      );
    });

    it('maps Stripe StripeSignatureVerificationError to BadRequestException', () => {
      const webhookSdk: StripeWebhookSdkFixture =
        service.getClient() as unknown as StripeWebhookSdkFixture;
      jest
        .spyOn(webhookSdk.webhooks, 'constructEvent')
        .mockImplementation(() => {
          throw new Stripe.errors.StripeSignatureVerificationError(
            'stripe-signature',
            Buffer.alloc(1),
          );
        });
      expect(() => {
        asStripeWebhookMethodHost(service).constructWebhookEvent(
          Buffer.from('{}'),
          'invalid_signature',
        );
      }).toThrow(BadRequestException);
    });
  });
});
