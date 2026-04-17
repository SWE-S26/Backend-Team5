import Stripe from 'stripe';
import {
  FindTransactionsResult,
  PaymentRepository,
} from './payment.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import logger from '../../shared/logger/logger';
import { IUser } from '../../shared/models/models.user';
import { PaymentMapper } from './dtos/payment.mapper';
import {
  CreatePayingUserResponse,
  GetPlanPricesResponse,
  GetSubscriptionResponse,
  SubscriptionCancelledResult,
  SubscriptionCreatedResult,
  SubscriptionUpdatedResult,
} from './dtos/payment.response';
import emailService from '../../shared/abstractions/email/email.service';

export interface PricePlans {
  role: string;
  subscriptionType: string;
  unlimited: boolean;
  label: string;
}

const PRICE_TO_PLAN: Record<string, PricePlans> = {
  price_1TGQ4EKiCVlMQgBUJwZCK3um: {
    role: 'Pro',
    subscriptionType: 'pro_monthly',
    unlimited: true,
    label: 'Pro Monthly',
  },
  price_1TGj1nKiCVlMQgBU9j8T38Fr: {
    role: 'Pro',
    subscriptionType: 'pro_yearly',
    unlimited: true,
    label: 'Pro Yearly',
  },
};

export class PaymentService {
  private readonly repository: PaymentRepository;
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor() {
    this.repository = new PaymentRepository();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-02-25.clover',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  private validateUser(user: IUser | null): asserts user is IUser {
    if (!user) {
      throw NotFoundError('User not found');
    }

    if (user.role === 'Admin') {
      throw ForbiddenError('Admin users cannot have subscriptions');
    }
  }

  private validateCustomerId(customerId: string): void {
    if (!customerId) {
      throw BadRequestError('Stripe customer ID is required');
    }
  }

  private validatePriceId(priceId: string): void {
    if (!PRICE_TO_PLAN[priceId]) {
      throw BadRequestError('Invalid price ID');
    }
  }

  private async recordTransaction(
    fields: Parameters<PaymentRepository['createTransaction']>[0],
  ): Promise<void> {
    try {
      await this.repository.createTransaction(fields);
    } catch (error) {
      logger.error(
        `Failed to record transaction [${fields.type}] for user ${fields.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getPlanPrices(): Promise<GetPlanPricesResponse> {
    const prices = await this.stripe.prices.list({
      expand: ['data.product'],
    });

    // There is a test product that can't be deleted — filtering is applied
    // inside the mapper to only include Monthly and Yearly products.
    return PaymentMapper.toGetPlanPricesResponse(prices.data);
  }

  async createPayingUser(
    userId: string,
    paymentMethodId: string,
  ): Promise<CreatePayingUserResponse> {
    const user = await this.repository.findUserById(userId);
    this.validateUser(user);

    if (user.stripeCustomerId) {
      throw BadRequestError('User already has a Stripe customer ID');
    }

    let customer: Stripe.Customer;
    try {
      customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Stripe customer creation failed ${error.message}`);
        throw BadRequestError(
          'Failed to create Stripe customer: ' + error.message,
        );
      }

      throw BadRequestError('Failed to create Stripe customer');
    }

    await this.repository.updateUser(userId, { stripeCustomerId: customer.id });

    return PaymentMapper.toCreatePayingUserResponse(customer.id);
  }

  async createSubscription(
    userId: string,
    priceId: string,
  ): Promise<SubscriptionCreatedResult> {
    const user = await this.repository.findUserById(userId);

    this.validateUser(user);
    this.validateCustomerId(user.stripeCustomerId!);
    this.validatePriceId(priceId);

    if (user.stripeSubscriptionId) {
      throw BadRequestError('User already has an active subscription');
    }

    let subscription: Stripe.Subscription;
    try {
      subscription = await this.stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Stripe subscription creation failed ${error.message}`);
        throw BadRequestError(
          'Failed to create Stripe subscription: ' + error.message,
        );
      }

      throw BadRequestError('Failed to create Stripe subscription');
    }

    const plan = PRICE_TO_PLAN[priceId];

    await this.repository.updateUser(userId, {
      stripeSubscriptionId: subscription.id,
      isPaid: true,
      ...(plan && {
        role: plan.role,
        'subscription.subscriptionType': plan.subscriptionType,
        'subscription.quota.unlimited': plan.unlimited,
      }),
    });

    await this.recordTransaction({
      userId,
      stripeCustomerId: user.stripeCustomerId!,
      stripeSubscriptionId: subscription.id,
      type: 'subscription_created',
      subscriptionType: plan.subscriptionType,
      description: `Subscribed to ${plan.label}`,
    });

    return PaymentMapper.toSubscriptionCreatedResult(
      user,
      subscription,
      plan.subscriptionType,
    );
  }

  async getSubscription(userId: string): Promise<GetSubscriptionResponse> {
    const user = await this.repository.findUserById(userId);

    this.validateUser(user);

    if (!user.stripeSubscriptionId) {
      throw NotFoundError('Subscription not found');
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );

    return PaymentMapper.toGetSubscriptionResponse(user, subscription);
  }

  async updateSubscription(
    userId: string,
    priceId: string,
  ): Promise<SubscriptionUpdatedResult> {
    const user = await this.repository.findUserById(userId);

    this.validateUser(user);
    this.validatePriceId(priceId);
    this.validateCustomerId(user.stripeCustomerId!);

    if (!user.stripeCustomerId) {
      throw BadRequestError(
        "No Stripe customer found. make sure you're a paying user.",
      );
    }

    if (!user.stripeSubscriptionId) {
      throw NotFoundError('Subscription not found');
    }

    if (
      PRICE_TO_PLAN[priceId].subscriptionType ===
      user.subscription?.subscriptionType
    ) {
      throw BadRequestError('You are already subscribed to this plan');
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const currentItemId = subscription.items.data[0]?.id;

    try {
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{ id: currentItemId, price: priceId }],
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Stripe subscription update failed ${error.message}`);
        throw BadRequestError(
          'Failed to update Stripe subscription: ' + error.message,
        );
      }

      throw BadRequestError('Failed to update Stripe subscription');
    }

    const oldPlanSubscriptionType =
      user.subscription?.subscriptionType ?? 'unknown';

    const plan = PRICE_TO_PLAN[priceId];

    const oldLabel =
      Object.values(PRICE_TO_PLAN).find(
        (p) => p.subscriptionType === oldPlanSubscriptionType,
      )?.label ?? oldPlanSubscriptionType;

    await this.repository.updateUser(userId, {
      role: plan.role,
      'subscription.subscriptionType': plan.subscriptionType,
      'subscription.quota.unlimited': plan.unlimited,
    });

    await this.recordTransaction({
      userId,
      stripeCustomerId: user.stripeCustomerId!,
      stripeSubscriptionId: user.stripeSubscriptionId!,
      type: 'subscription_updated',
      subscriptionType: plan.subscriptionType,
      description: `Switched from ${oldLabel} to ${plan.label}`,
    });

    return PaymentMapper.toSubscriptionUpdatedResult(
      user,
      oldPlanSubscriptionType,
      plan.subscriptionType,
    );
  }

  async cancelSubscription(
    userId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<SubscriptionCancelledResult> {
    const user = await this.repository.findUserById(userId);

    this.validateUser(user);
    this.validateCustomerId(user.stripeCustomerId!);

    if (!user.stripeSubscriptionId) {
      throw NotFoundError('Subscription not found');
    }

    // If there are forms of quota, I will edit it later.
    if (user.tracks.length > 3) {
      throw ForbiddenError(
        `
        Please delete some of your posted tracks before cancelling your subscription. 
        You currently have ${user.tracks.length} tracks 
        and the limit for non-paying users is 3 tracks.
        `,
      );
    }

    if (user.playlists.length > 2) {
      throw ForbiddenError(
        `
        Please delete some of your posted playlists before cancelling your subscription. 
        You currently have ${user.playlists.length} playlists 
        and the limit for non-paying users is 2 playlists.
        `,
      );
    }

    if (cancelAtPeriodEnd) {
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await this.recordTransaction({
        userId,
        stripeCustomerId: user.stripeCustomerId!,
        stripeSubscriptionId: user.stripeSubscriptionId!,
        type: 'subscription_cancelled',
        subscriptionType: user.subscription?.subscriptionType ?? 'unknown',
        description: cancelAtPeriodEnd
          ? 'Subscription set to cancel at period end'
          : 'Subscription cancelled immediately',
      });

      return PaymentMapper.toSubscriptionCancelledResult(user);
    }

    await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);

    const role = 'Listener';
    await this.repository.updateUser(
      userId,
      {
        isPaid: false,
        role: role,
        'subscription.subscriptionType': 'free',
        'subscription.quota.unlimited': false,
      },
      { stripeSubscriptionId: 1 },
    );

    await this.recordTransaction({
      userId,
      stripeCustomerId: user.stripeCustomerId!,
      stripeSubscriptionId: user.stripeSubscriptionId!,
      type: 'subscription_cancelled',
      subscriptionType: user.subscription?.subscriptionType ?? 'unknown',
      description: cancelAtPeriodEnd
        ? 'Subscription set to cancel at period end'
        : 'Subscription cancelled immediately',
    });

    return PaymentMapper.toSubscriptionCancelledResult(user);
  }

  async deleteStripeCustomer(stripeCustomerId: string): Promise<void> {
    try {
      await this.stripe.customers.del(stripeCustomerId);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Stripe customer deletion failed ${error.message}`);
        throw BadRequestError(
          'Failed to delete Stripe customer: ' + error.message,
        );
      }

      throw BadRequestError('Failed to delete Stripe customer');
    }
  }

  async getTransactionHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<FindTransactionsResult> {
    const user = await this.repository.findUserById(userId);
    this.validateUser(user);

    return this.repository.findTransactionsByUserId(userId, page, limit);
  }

  private extractSubscriptionId(invoice: Stripe.Invoice): string | null {
    if (invoice.parent?.type === 'subscription_details') {
      const sub = invoice.parent.subscription_details?.subscription;
      return typeof sub === 'string' ? sub : (sub?.id ?? null);
    }
    return null;
  }

  private extractPriceId(invoice: Stripe.Invoice): string {
    const line = invoice.lines?.data[0];
    if (!line) return '';

    // New clover-era path
    const pricingPrice = line.pricing?.price_details?.price;
    if (pricingPrice) {
      return typeof pricingPrice === 'string' ? pricingPrice : pricingPrice.id;
    }

    return '';
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );

      logger.info(`Received Stripe webhook: ${event.type}`);
    } catch (error) {
      throw BadRequestError('Invalid Stripe webhook signature');
    }

    switch (event!.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const user = await this.repository.findUserByStripeCustomerId(
          invoice.customer as string,
        );

        if (user) {
          await this.repository.updateUser(user._id.toString(), {
            isPaid: true,
          });

          const invoiceId = invoice.id;
          const existing =
            await this.repository.findTransactionByInvoiceId(invoiceId);

          if (!existing) {
            const priceId = this.extractPriceId(invoice);
            const plan = PRICE_TO_PLAN[priceId];

            await this.recordTransaction({
              userId: user._id.toString(),
              stripeCustomerId: invoice.customer as string,
              stripeSubscriptionId: this.extractSubscriptionId(invoice),
              stripeInvoiceId: invoiceId,
              type: 'payment_succeeded',
              amount: invoice.amount_paid,
              currency: invoice.currency,
              subscriptionType: plan?.subscriptionType ?? 'unknown',
              description: `Payment of ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()} for ${plan?.label ?? 'subscription'}`,
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const user = await this.repository.findUserByStripeCustomerId(
          invoice.customer as string,
        );

        if (user) {
          await this.repository.updateUser(user._id.toString(), {
            isPaid: false,
          });

          const invoiceId = invoice.id;
          const existing =
            await this.repository.findTransactionByInvoiceId(invoiceId);

          if (!existing) {
            const priceId = this.extractPriceId(invoice);
            const plan = PRICE_TO_PLAN[priceId];

            await this.recordTransaction({
              userId: user._id.toString(),
              stripeCustomerId: invoice.customer as string,
              stripeSubscriptionId: this.extractSubscriptionId(invoice),
              stripeInvoiceId: invoiceId,
              type: 'payment_failed',
              amount: invoice.amount_due,
              currency: invoice.currency,
              subscriptionType: plan?.subscriptionType ?? 'unknown',
              description: `Failed payment of ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()} for ${plan?.label ?? 'subscription'}`,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await this.repository.findUserByStripeCustomerId(
          subscription.customer as string,
        );

        if (user) {
          const role = 'Listener';
          await this.repository.updateUser(
            user._id.toString(),
            {
              isPaid: false,
              role: role,
              'subscription.subscriptionType': 'free',
              'subscription.quota.unlimited': false,
            },
            { stripeSubscriptionId: 1 },
          );

          const { emailData } =
            PaymentMapper.toSubscriptionCancelledResult(user);
          emailService.sendSubscriptionCancelled(
            emailData.userName,
            emailData.email,
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const user = await this.repository.findUserByStripeCustomerId(
          subscription.customer as string,
        );

        if (user && priceId) {
          const plan = PRICE_TO_PLAN[priceId];
          if (plan) {
            await this.repository.updateUser(user._id.toString(), {
              'subscription.subscriptionType': plan.subscriptionType,
              role: plan.role,
            });
          }
        }
        break;
      }

      default:
        break;
    }
  }
}
