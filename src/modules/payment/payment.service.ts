import Stripe from 'stripe';
import { PaymentRepository } from './payment.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import logger from '../../shared/logger/logger';
import { IUser } from '../../shared/models/models.user';

const PRICE_TO_PLAN: Record<
  string,
  { role: string; subscriptionType: string; unlimited: boolean }
> = {
  price_1TGQ4EKiCVlMQgBUJwZCK3um: {
    role: 'Pro',
    subscriptionType: 'pro_monthly',
    unlimited: true,
  },
  price_1TGj1nKiCVlMQgBU9j8T38Fr: {
    role: 'Pro',
    subscriptionType: 'pro_yearly',
    unlimited: true,
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

  async getPlanPrices(): Promise<
    Record<string, { priceId: string; amount: number }>
  > {
    const prices = await this.stripe.prices.list({
      expand: ['data.product'],
    });

    const planPrices: Record<
      string,
      {
        name: string;
        priceId: string;
        amount: number;
      }
    > = {};

    for (const price of prices.data) {
      const productName = (price.product as Stripe.Product).name;
      const amount = Number(((price.unit_amount ?? 0) / 100).toFixed(2));
      // There is test product that I can't delete, carefully not to spill it
      // on the response, so I must apply the filtering

      if (productName.includes('Monthly')) {
        planPrices.pro_monthly = {
          name: productName,
          priceId: price.id,
          amount,
        };
      } else if (productName.includes('Yearly')) {
        planPrices.pro_yearly = {
          name: productName,
          priceId: price.id,
          amount,
        };
      }
    }

    return planPrices;
  }

  async createPayingUser(
    userId: string,
    paymentMethodId: string,
  ): Promise<string> {
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

    return customer.id;
  }

  async createSubscription(userId: string, priceId: string): Promise<string> {
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

    return subscription.id;
  }

  async getSubscription(userId: string): Promise<{
    plan: string;
    status: string;
    currentPeriodEnd: string;
    isStripePayingCustomer: boolean;
  }> {
    const user = await this.repository.findUserById(userId);

    this.validateUser(user);

    if (!user.stripeSubscriptionId) {
      throw NotFoundError('Subscription not found');
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );

    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

    return {
      plan: user.subscription?.subscriptionType ?? 'unknown',
      status: subscription.status,
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : 'unknown',
      isStripePayingCustomer: user.stripeCustomerId ? true : false,
    };
  }

  async updateSubscription(userId: string, priceId: string): Promise<void> {
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

    const plan = PRICE_TO_PLAN[priceId];
    if (plan) {
      await this.repository.updateUser(userId, {
        role: plan.role,
        'subscription.subscriptionType': plan.subscriptionType,
        'subscription.quota.unlimited': plan.unlimited,
      });
    }
  }

  async cancelSubscription(
    userId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<void> {
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

    if (cancelAtPeriodEnd) {
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return;
    }

    await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);

    let role = 'Listener';
    if (user.tracks.length > 0) {
      role = 'Artist';
    }

    await this.repository.updateUser(
      userId,
      { isPaid: false, role: role },
      { stripeSubscriptionId: 1 },
    );
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
        // Recurring payment succeeded — ensure user is marked as paid
        const invoice = event.data.object as Stripe.Invoice;
        const user = await this.repository.findUserByStripeCustomerId(
          invoice.customer as string,
        );

        if (user) {
          await this.repository.updateUser(user._id.toString(), {
            isPaid: true,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed — you may want to notify the user or restrict access
        const invoice = event.data.object as Stripe.Invoice;
        const user = await this.repository.findUserByStripeCustomerId(
          invoice.customer as string,
        );

        if (user) {
          await this.repository.updateUser(user._id.toString(), {
            isPaid: false,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription ended (immediate cancel or period-end cancel)
        const subscription = event.data.object as Stripe.Subscription;
        const user = await this.repository.findUserByStripeCustomerId(
          subscription.customer as string,
        );

        if (user) {
          let role = 'Listener';
          if (user.tracks.length > 0) {
            role = 'Artist';
          }

          await this.repository.updateUser(
            user._id.toString(),
            { isPaid: false, role: role },
            { stripeSubscriptionId: 1 },
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
        // Unhandled event types — safe to ignore
        break;
    }
  }
}
