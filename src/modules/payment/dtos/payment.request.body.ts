import z from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';

export const CreatePayingUserRequestBodyDTO = extendedZod.object({
  paymentMethodId: extendedZod.string().min(1),
});

export const CreateSubscriptionRequestBodyDTO = extendedZod.object({
  priceId: extendedZod.string().min(1),
  promoCode: extendedZod.string().min(1).optional(),
});

export const UpdateSubscriptionRequestBodyDTO = extendedZod.object({
  priceId: extendedZod.string().min(1),
});

export const CancelSubscriptionRequestBodyDTO = extendedZod.object({
  cancelAtPeriodEnd: extendedZod.boolean().optional(),
});

export type CreatePayingUserRequestBody = z.infer<
  typeof CreatePayingUserRequestBodyDTO
>;

export type CreateSubscriptionRequestBody = z.infer<
  typeof CreateSubscriptionRequestBodyDTO
>;

export type UpdateSubscriptionRequestBody = z.infer<
  typeof UpdateSubscriptionRequestBodyDTO
>;

export type CancelSubscriptionRequestBody = z.infer<
  typeof CancelSubscriptionRequestBodyDTO
>;
