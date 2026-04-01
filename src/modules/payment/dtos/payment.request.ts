import extendedZod from '../../../shared/docs/dtoDocumenter';
import z from 'zod';
import {
  CancelSubscriptionRequestBodyDTO,
  CreatePayingUserRequestBodyDTO,
  CreateSubscriptionRequestBodyDTO,
  UpdateSubscriptionRequestBodyDTO,
} from './payment.request.body';

export const CreatePayingUserRequestDTO = extendedZod.object({
  body: CreatePayingUserRequestBodyDTO,
});

export const CreateSubscriptionRequestDTO = extendedZod.object({
  body: CreateSubscriptionRequestBodyDTO,
});

export const UpdateSubscriptionRequestDTO = extendedZod.object({
  body: UpdateSubscriptionRequestBodyDTO,
});

export const CancelSubscriptionRequestDTO = extendedZod.object({
  body: CancelSubscriptionRequestBodyDTO,
});

export type CreatePayingUserRequest = z.infer<
  typeof CreatePayingUserRequestDTO
>;

export type CreateSubscriptionRequest = z.infer<
  typeof CreateSubscriptionRequestDTO
>;

export type UpdateSubscriptionRequest = z.infer<
  typeof UpdateSubscriptionRequestDTO
>;

export type CancelSubscriptionRequest = z.infer<
  typeof CancelSubscriptionRequestDTO
>;
