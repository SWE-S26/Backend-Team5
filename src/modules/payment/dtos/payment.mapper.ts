import Stripe from 'stripe';
import { IUser } from '../../../shared/models/models.user';
import {
  CreatePayingUserResponse,
  CreateSubscriptionResponse,
  GetPlanPricesResponse,
  GetSubscriptionResponse,
  SubscriptionCancelledResult,
  SubscriptionCreatedResult,
  SubscriptionUpdatedResult,
} from './payment.response';

export class PaymentMapper {
  // ───────────────────────────────────────────────────────────────────────────
  // Client-facing response mappers
  // ───────────────────────────────────────────────────────────────────────────

  static toCreatePayingUserResponse(
    stripeCustomerId: string,
  ): CreatePayingUserResponse {
    return { userId: stripeCustomerId };
  }

  static toGetPlanPricesResponse(
    prices: Stripe.Price[],
  ): GetPlanPricesResponse {
    const result: GetPlanPricesResponse = {};

    for (const price of prices) {
      const productName = (price.product as Stripe.Product).name;
      const amount = Number(((price.unit_amount ?? 0) / 100).toFixed(2));

      if (productName.includes('Monthly')) {
        result.pro_monthly = { name: productName, priceId: price.id, amount };
      } else if (productName.includes('Yearly')) {
        result.pro_yearly = { name: productName, priceId: price.id, amount };
      }
    }

    return result;
  }

  static toGetSubscriptionResponse(
    user: IUser,
    subscription: Stripe.Subscription,
  ): GetSubscriptionResponse {
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

    return {
      plan: user.subscription?.subscriptionType ?? 'unknown',
      status: subscription.status,
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : 'unknown',
      isStripePayingCustomer: !!user.stripeCustomerId,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internal result mappers (client response + email data bundled together)
  // ───────────────────────────────────────────────────────────────────────────

  static toSubscriptionCreatedResult(
    user: IUser,
    subscription: Stripe.Subscription,
    planSubscriptionType: string,
  ): SubscriptionCreatedResult {
    return {
      clientResponse: { subscriptionId: subscription.id },
      emailData: {
        userName: user.displayName,
        email: user.email,
        planName: planSubscriptionType.replace('_', ' ').toUpperCase(),
      },
    };
  }

  static toSubscriptionUpdatedResult(
    user: IUser,
    oldPlanSubscriptionType: string,
    newPlanSubscriptionType: string,
  ): SubscriptionUpdatedResult {
    return {
      emailData: {
        userName: user.displayName,
        email: user.email,
        oldPlanName: oldPlanSubscriptionType.replace('_', ' ').toUpperCase(),
        planName: newPlanSubscriptionType.replace('_', ' ').toUpperCase(),
      },
    };
  }

  static toSubscriptionCancelledResult(
    user: IUser,
  ): SubscriptionCancelledResult {
    return {
      emailData: {
        userName: user.displayName,
        email: user.email,
      },
    };
  }
}
