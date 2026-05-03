import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ExecutionContext } from '@nestjs/common';

import { StripeWebhookSignatureGuard } from '../stripe-webhook-signature.guard';
import { StripeService } from '../../../../shared/stripe/stripe.service';
import type {
  StripeWebhookIncomingRequest,
  StripeWebhookVerifiedSdkEvent,
} from '../../types/stripe-webhook-http.types';

const createStripeMockEvent = (): StripeWebhookVerifiedSdkEvent =>
  ({
    id: 'evt_guard',
    type: 'payment_intent.succeeded',
    data: { object: {} },
  }) as StripeWebhookVerifiedSdkEvent;

const createExecutionContext = (
  req: StripeWebhookIncomingRequest,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: (): StripeWebhookIncomingRequest => req,
    }),
  }) as ExecutionContext;

describe('StripeWebhookSignatureGuard', () => {
  let moduleRef: TestingModule;
  let guard: StripeWebhookSignatureGuard;
  let stripeService: { constructWebhookEvent: jest.Mock };

  beforeEach(async () => {
    stripeService = {
      constructWebhookEvent: jest.fn(),
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookSignatureGuard,
        {
          provide: StripeService,
          useValue: stripeService,
        },
      ],
    }).compile();
    guard = moduleRef.get(StripeWebhookSignatureGuard);
  });

  afterEach(async (): Promise<void> => {
    await moduleRef.close();
  });

  it('throws BadRequestException when raw body is missing', () => {
    const req: StripeWebhookIncomingRequest = {
      headers: { 'stripe-signature': 'v1,abc' },
      rawBody: undefined,
    } as unknown as StripeWebhookIncomingRequest;
    expect(() => guard.canActivate(createExecutionContext(req))).toThrow(
      BadRequestException,
    );
    expect(stripeService.constructWebhookEvent).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when stripe-signature header is missing', () => {
    const req: StripeWebhookIncomingRequest = {
      headers: {},
      rawBody: Buffer.from('{}'),
    } as unknown as StripeWebhookIncomingRequest;
    expect(() => guard.canActivate(createExecutionContext(req))).toThrow(
      BadRequestException,
    );
    expect(stripeService.constructWebhookEvent).not.toHaveBeenCalled();
  });

  it('attaches verified event to the request and returns true', () => {
    const mockEvent: StripeWebhookVerifiedSdkEvent = createStripeMockEvent();
    stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
    const rawBody: Buffer = Buffer.from('{"ok":true}');
    const req: StripeWebhookIncomingRequest = {
      headers: { 'stripe-signature': 'v1,valid' },
      rawBody,
    } as unknown as StripeWebhookIncomingRequest;
    const actual: boolean = guard.canActivate(createExecutionContext(req));
    expect(actual).toBe(true);
    expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(
      rawBody,
      'v1,valid',
    );
    expect(req.stripeWebhookEvent).toBe(mockEvent);
  });

  it('uses the first signature when header is an array', () => {
    const mockEvent: StripeWebhookVerifiedSdkEvent = createStripeMockEvent();
    stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
    const rawBody: Buffer = Buffer.from('{}');
    const req: StripeWebhookIncomingRequest = {
      headers: { 'stripe-signature': ['v1,first', 'v1,second'] },
      rawBody,
    } as unknown as StripeWebhookIncomingRequest;
    guard.canActivate(createExecutionContext(req));
    expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(
      rawBody,
      'v1,first',
    );
  });
});
