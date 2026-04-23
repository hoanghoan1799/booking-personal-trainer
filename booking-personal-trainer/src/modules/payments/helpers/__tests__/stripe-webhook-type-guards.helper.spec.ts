import {
  isStripeChargeRefundedLike,
  isStripePaymentIntentLike,
} from '../stripe-webhook-type-guards.helper';

describe('stripe-webhook-type-guards', () => {
  describe('isStripePaymentIntentLike', () => {
    it('should return true for valid shape', () => {
      const actual = isStripePaymentIntentLike({
        id: 'pi_1',
        status: 'succeeded',
      });
      expect(actual).toBe(true);
    });

    it('should return false for non-object', () => {
      expect(isStripePaymentIntentLike(null)).toBe(false);
      expect(isStripePaymentIntentLike('x')).toBe(false);
    });

    it('should return false when missing required fields', () => {
      expect(isStripePaymentIntentLike({ id: 'pi_1' })).toBe(false);
      expect(isStripePaymentIntentLike({ status: 'succeeded' })).toBe(false);
    });
  });

  describe('isStripeChargeRefundedLike', () => {
    it('should return true for valid shape', () => {
      const actual = isStripeChargeRefundedLike({ id: 'ch_1' });
      expect(actual).toBe(true);
    });

    it('should return false for non-object', () => {
      expect(isStripeChargeRefundedLike(undefined)).toBe(false);
      expect(isStripeChargeRefundedLike(1)).toBe(false);
    });

    it('should return false when id is not a string', () => {
      expect(isStripeChargeRefundedLike({ id: 1 })).toBe(false);
    });
  });
});
