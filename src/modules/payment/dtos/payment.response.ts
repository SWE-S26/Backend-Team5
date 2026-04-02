import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';

export const PlanPriceEntryResponseSchema = extendedZod
  .object({
    name: extendedZod.string(),
    priceId: extendedZod.string(),
    amount: extendedZod.number(),
  })
  .openapi('PlanPriceEntry', {
    example: {
      name: 'Pro Monthly',
      priceId: 'price_1TGQ4EKiCVlMQgBUJwZCK3um',
      amount: 9.99,
    },
  });

export const GetPlanPricesResponseSchema = extendedZod
  .record(extendedZod.string(), PlanPriceEntryResponseSchema)
  .openapi('GetPlanPricesResponse', {
    example: {
      pro_monthly: {
        name: 'Pro Monthly',
        priceId: 'price_1TGQ4EKiCVlMQgBUJwZCK3um',
        amount: 9.99,
      },
      pro_yearly: {
        name: 'Pro Yearly',
        priceId: 'price_1TGj1nKiCVlMQgBU9j8T38Fr',
        amount: 99.99,
      },
    },
  });

export const CreatePayingUserResponseSchema = extendedZod
  .object({
    userId: extendedZod.string(),
  })
  .openapi('CreatePayingUserResponse', {
    example: { userId: 'cus_ABC123XYZ' },
  });

export const CreateSubscriptionResponseSchema = extendedZod
  .object({
    subscriptionId: extendedZod.string(),
  })
  .openapi('CreateSubscriptionResponse', {
    example: { subscriptionId: 'sub_123456789' },
  });

export const GetSubscriptionResponseSchema = extendedZod
  .object({
    plan: extendedZod.string(),
    status: extendedZod.string(),
    currentPeriodEnd: extendedZod.string(),
    isStripePayingCustomer: extendedZod.boolean(),
  })
  .openapi('GetSubscriptionResponse', {
    example: {
      plan: 'pro_monthly',
      status: 'active',
      currentPeriodEnd: '2026-04-01T00:00:00.000Z',
      isStripePayingCustomer: true,
    },
  });

export type PlanPriceEntryResponse = z.infer<
  typeof PlanPriceEntryResponseSchema
>;
export type GetPlanPricesResponse = z.infer<typeof GetPlanPricesResponseSchema>;
export type CreatePayingUserResponse = z.infer<
  typeof CreatePayingUserResponseSchema
>;
export type CreateSubscriptionResponse = z.infer<
  typeof CreateSubscriptionResponseSchema
>;
export type GetSubscriptionResponse = z.infer<
  typeof GetSubscriptionResponseSchema
>;

export type SubscriptionCreatedResult = {
  clientResponse: CreateSubscriptionResponse;
  emailData: {
    userName: string;
    email: string;
    planName: string;
  };
};

export type SubscriptionUpdatedResult = {
  emailData: {
    userName: string;
    email: string;
    oldPlanName: string;
    planName: string;
  };
};

export type SubscriptionCancelledResult = {
  emailData: {
    userName: string;
    email: string;
  };
};
