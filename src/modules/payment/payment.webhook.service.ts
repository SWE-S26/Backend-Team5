import Stripe from 'stripe';
import { PaymentRepository } from './payment.repository';
import { BadRequestError } from '../../shared/errors/responseErrors';
import logger from '../../shared/logger/logger';
import { PaymentMapper } from './dtos/payment.mapper';
import emailService from '../../shared/abstractions/email/email.service';
import { PricePlans } from './payment.service';

export class PaymentWebhookService {
  constructor(
    readonly repository: PaymentRepository,
    readonly stripe: Stripe,
    readonly webhookSecret: string,
    readonly PRICE_TO_PLAN: Record<string, PricePlans>,
  ) {}

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
            const plan = this.PRICE_TO_PLAN[priceId];

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
            const plan = this.PRICE_TO_PLAN[priceId];

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
          const plan = this.PRICE_TO_PLAN[priceId];
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
