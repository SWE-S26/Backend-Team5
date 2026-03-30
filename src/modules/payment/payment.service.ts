import Stripe from 'stripe';
import { PaymentRepository } from './payment.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import logger from '../../shared/logger/logger';

const PRICE_TO_PLAN: Record<
  string,
  { role: string; subscriptionType: string; unlimited: boolean }
> = {
  prod_UEtrBxZh2Hig5q: {
    role: 'Pro',
    subscriptionType: 'pro_monthly',
    unlimited: true,
  },
  // 'prod_UEtrBxZh2Hig5q': {
  //   role: 'Pro',
  //   subscriptionType: 'pro_yearly',
  //   unlimited: true,
  // },
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
      // on the response

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
    if (!user) {
      throw NotFoundError('User not found');
    }
    if (user.stripeCustomerId) {
      throw BadRequestError('User already has a Stripe customer ID');
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    // customer;

    await this.repository.updateUser(userId, { stripeCustomerId: customer.id });

    return customer.id;
  }

  async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId: string,
  ): Promise<string> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw NotFoundError('User not found');
    }

    if (!user.stripeCustomerId) {
      throw BadRequestError(
        "No Stripe customer found. make sure you're a paying user.",
      );
    }

    if (user.role === 'Admin') {
      throw ForbiddenError('Admin users cannot have subscriptions');
    }

    const attachedMethod = await this.stripe.paymentMethods.attach(
      paymentMethodId,
      {
        customer: user.stripeCustomerId,
      },
    );
    await this.stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: attachedMethod.id },
    });

    const subscription = await this.stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

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
  }> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw NotFoundError('User not found');
    }

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
    };
  }

  async updateSubscription(userId: string, priceId: string): Promise<void> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw NotFoundError('User not found');
    }

    if (!user.stripeSubscriptionId) {
      throw NotFoundError('Subscription not found');
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const currentItemId = subscription.items.data[0]?.id;

    await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [{ id: currentItemId, price: priceId }],
      proration_behavior: 'create_prorations', // or 'none' based on your billing policy
    });

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

    if (!user) {
      throw NotFoundError('User not found');
    }

    if (!user.stripeSubscriptionId) {
      throw NotFoundError('Subscription not found');
    }

    if (user.role === 'Admin') {
      throw ForbiddenError('Admin users cannot have subscriptions');
    }

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
      // Schedule cancellation — user keeps access until period ends
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      // Actual cleanup happens in the webhook (customer.subscription.deleted)
    } else {
      // Cancel immediately
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
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
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
          // Optionally mark as unpaid, send email, etc.
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
        // Plan changed, trial ended, etc.
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
