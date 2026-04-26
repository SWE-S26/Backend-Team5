import { PaymentWebhookService } from '../../../src/modules/payment/payment.webhook.service';
import { PaymentRepository } from '../../../src/modules/payment/payment.repository';
import { PaymentMapper } from '../../../src/modules/payment/dtos/payment.mapper';
import emailService from '../../../src/shared/abstractions/email/email.service';
import Stripe from 'stripe';
import { Types } from 'mongoose';
import { IUser } from '../../../src/shared/models/models.user';
import { PricePlans } from '../../../src/modules/payment/payment.service';

jest.mock('../../../src/modules/payment/payment.repository');
jest.mock('../../../src/shared/abstractions/email/email.service');
jest.mock('../../../src/shared/logger/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const VALID_PRICE_MONTHLY = 'price_1TGQ4EKiCVlMQgBUJwZCK3um';
const VALID_PRICE_YEARLY = 'price_1TGj1nKiCVlMQgBU9j8T38Fr';
const UNKNOWN_PRICE_ID = 'price_unknown_000';

const PRICE_TO_PLAN: Record<string, PricePlans> = {
  [VALID_PRICE_MONTHLY]: {
    role: 'Pro',
    subscriptionType: 'pro_monthly',
    unlimited: true,
    label: 'Pro Monthly',
  },
  [VALID_PRICE_YEARLY]: {
    role: 'Pro',
    subscriptionType: 'pro_yearly',
    unlimited: true,
    label: 'Pro Yearly',
  },
};

const fakeUser: IUser = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  email: 'test@mail.com',
  password: 'hashed_password',
  role: 'Pro',
  displayName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  city: 'Cairo',
  country: 'Egypt',
  isPrivate: false,
  bio: '',
  dateOfBirth: new Date('1995-01-01'),
  gender: 'Male',
  isVerified: true,
  profileImg: {
    imgLink: 'https://example.com/profile.jpg',
    publicId: 'profile_123',
  },
  bannerImg: {
    imgLink: 'https://example.com/banner.jpg',
    publicId: 'banner_123',
  },
  socialMediaLinks: [],
  tracks: [],
  playlists: [],
  profileLink: 'https://example.com/johndoe',
  links: [],
  supportLink: '',
  likedPlaylists: [],
  likedTracks: [],
  uploads: [],
  reposts: [],
  isPaid: true,
  ban: false,
  banReason: '',
  stripeCustomerId: 'cus_test_123',
  stripeSubscriptionId: 'sub_test_123',
  subscription: {
    subscriptionType: 'pro_monthly',
    quota: { unlimited: true, usedSeconds: 0, leftSeconds: 0 },
  },
};

function buildInvoice(overrides: {
  customerId?: string;
  invoiceId?: string;
  amountPaid?: number;
  amountDue?: number;
  currency?: string;
  priceId?: string | null;
  subscriptionId?: string | { id: string } | null;
}): Stripe.Invoice {
  const {
    customerId = 'cus_test_123',
    invoiceId = 'in_test_001',
    amountPaid = 999,
    amountDue = 999,
    currency = 'usd',
    priceId = VALID_PRICE_MONTHLY,
    subscriptionId = 'sub_test_123',
  } = overrides;

  return {
    id: invoiceId,
    customer: customerId,
    amount_paid: amountPaid,
    amount_due: amountDue,
    currency,
    lines: priceId
      ? {
          data: [
            {
              pricing: {
                price_details: { price: priceId },
              },
            },
          ],
        }
      : { data: [] },
    parent:
      subscriptionId !== null
        ? {
            type: 'subscription_details',
            subscription_details: { subscription: subscriptionId },
          }
        : null,
  } as unknown as Stripe.Invoice;
}

function buildSubscriptionEvent(
  type: 'customer.subscription.deleted' | 'customer.subscription.updated',
  overrides: { customerId?: string; priceId?: string } = {},
): Stripe.Event {
  const { customerId = 'cus_test_123', priceId = VALID_PRICE_MONTHLY } =
    overrides;

  return {
    type,
    data: {
      object: {
        customer: customerId,
        items: { data: [{ price: { id: priceId } }] },
      } as Stripe.Subscription,
    },
  } as Stripe.Event;
}

let webhookService: PaymentWebhookService;
let mockRepository: jest.Mocked<PaymentRepository>;

let mockStripe: { webhooks: { constructEvent: jest.Mock } };

const RAW_BODY = Buffer.from('{"type":"invoice.paid"}');
const VALID_SIGNATURE = 'stripe_sig_valid';
const WEBHOOK_SECRET = 'whsec_test_secret';

function mockConstructEvent(event: Stripe.Event): void {
  mockStripe.webhooks.constructEvent.mockReturnValue(event);
}

describe('PaymentWebhookService : signature validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe = { webhooks: { constructEvent: jest.fn() } };
    mockRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    webhookService = new PaymentWebhookService(
      mockRepository,
      mockStripe as unknown as Stripe,
      WEBHOOK_SECRET,
      PRICE_TO_PLAN,
    );
  });

  it('should throw BadRequestError when constructEvent throws', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Signature mismatch');
    });

    await expect(
      webhookService.handleWebhook(RAW_BODY, 'bad_signature'),
    ).rejects.toThrow('Invalid Stripe webhook signature');
  });

  it('should call constructEvent with rawBody, signature and webhookSecret', async () => {
    mockConstructEvent({
      type: 'unknown.event',
      data: { object: {} },
    } as unknown as Stripe.Event);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      RAW_BODY,
      VALID_SIGNATURE,
      WEBHOOK_SECRET,
    );
  });

  it('should not throw for unrecognized event types', async () => {
    mockConstructEvent({
      type: 'some.unknown.event',
      data: { object: {} },
    } as unknown as Stripe.Event);

    await expect(
      webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE),
    ).resolves.toBeUndefined();
  });
});

describe('PaymentWebhookService : invoice.paid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe = { webhooks: { constructEvent: jest.fn() } };
    mockRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    webhookService = new PaymentWebhookService(
      mockRepository,
      mockStripe as unknown as Stripe,
      WEBHOOK_SECRET,
      PRICE_TO_PLAN,
    );
  });

  function setupPaidEvent(
    invoiceOverrides: Parameters<typeof buildInvoice>[0] = {},
  ): void {
    const invoice = buildInvoice(invoiceOverrides);
    mockConstructEvent({
      type: 'invoice.paid',
      data: { object: invoice },
    } as unknown as Stripe.Event);
  }

  it('should call updateUser with isPaid: true when user is found', async () => {
    setupPaidEvent();
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      { isPaid: true },
    );
  });

  it('should not call updateUser when user is not found', async () => {
    setupPaidEvent();
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(null);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).not.toHaveBeenCalled();
  });

  it('should call findUserByStripeCustomerId with the invoice customer id', async () => {
    setupPaidEvent({ customerId: 'cus_abc_999' });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(null);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.findUserByStripeCustomerId).toHaveBeenCalledWith(
      'cus_abc_999',
    );
  });

  it('should record a payment_succeeded transaction when no existing transaction is found', async () => {
    setupPaidEvent({
      invoiceId: 'in_new_001',
      amountPaid: 1999,
      currency: 'usd',
    });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: fakeUser._id.toString(),
        stripeInvoiceId: 'in_new_001',
        type: 'payment_succeeded',
        amount: 1999,
        currency: 'usd',
      }),
    );
  });

  it('should not record a transaction when one already exists for that invoiceId', async () => {
    setupPaidEvent({ invoiceId: 'in_existing_001' });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue({
      id: 'existing',
    } as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).not.toHaveBeenCalled();
  });

  it('should use the correct plan subscriptionType and label when priceId is known', async () => {
    setupPaidEvent({
      priceId: VALID_PRICE_MONTHLY,
      amountPaid: 999,
      currency: 'usd',
    });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionType: 'pro_monthly',
        description: expect.stringContaining('Pro Monthly'),
      }),
    );
  });

  it('should fall back to subscriptionType "unknown" and label "subscription" when priceId is unrecognized', async () => {
    setupPaidEvent({
      priceId: UNKNOWN_PRICE_ID,
      amountPaid: 999,
      currency: 'usd',
    });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionType: 'unknown',
        description: expect.stringContaining('subscription'),
      }),
    );
  });

  it('should pass the extracted subscriptionId to the transaction when parent is subscription_details', async () => {
    setupPaidEvent({ subscriptionId: 'sub_extracted_abc' });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ stripeSubscriptionId: 'sub_extracted_abc' }),
    );
  });

  it('should extract subscriptionId from an object subscription — not just a string', async () => {
    setupPaidEvent({ subscriptionId: { id: 'sub_object_id_123' } });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ stripeSubscriptionId: 'sub_object_id_123' }),
    );
  });

  it('should pass null as stripeSubscriptionId when invoice has no subscription_details parent', async () => {
    setupPaidEvent({ subscriptionId: null });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ stripeSubscriptionId: null }),
    );
  });

  it('should still resolve when recordTransaction fails silently', async () => {
    setupPaidEvent();
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockRejectedValue(
      new Error('DB write failed'),
    );

    await expect(
      webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE),
    ).resolves.toBeUndefined();
  });
});

describe('PaymentWebhookService : invoice.payment_failed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe = { webhooks: { constructEvent: jest.fn() } };
    mockRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    webhookService = new PaymentWebhookService(
      mockRepository,
      mockStripe as unknown as Stripe,
      WEBHOOK_SECRET,
      PRICE_TO_PLAN,
    );
  });

  function setupFailedEvent(
    invoiceOverrides: Parameters<typeof buildInvoice>[0] = {},
  ): void {
    const invoice = buildInvoice(invoiceOverrides);
    mockConstructEvent({
      type: 'invoice.payment_failed',
      data: { object: invoice },
    } as unknown as Stripe.Event);
  }

  it('should call updateUser with isPaid: false when user is found', async () => {
    setupFailedEvent();
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      { isPaid: false },
    );
  });

  it('should not call updateUser when user is not found', async () => {
    setupFailedEvent();
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(null);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).not.toHaveBeenCalled();
  });

  it('should record a payment_failed transaction when no existing transaction is found', async () => {
    setupFailedEvent({
      invoiceId: 'in_fail_001',
      amountDue: 1999,
      currency: 'eur',
    });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: fakeUser._id.toString(),
        stripeInvoiceId: 'in_fail_001',
        type: 'payment_failed',
        amount: 1999,
        currency: 'eur',
      }),
    );
  });

  it('should use amount_due — not amount_paid — in the failed transaction', async () => {
    setupFailedEvent({ amountPaid: 0, amountDue: 999 });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 999 }),
    );
  });

  it('should not record a transaction when one already exists', async () => {
    setupFailedEvent({ invoiceId: 'in_existing_fail' });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue({
      id: 'existing',
    } as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).not.toHaveBeenCalled();
  });

  it('should use the correct plan label in the description when priceId is known', async () => {
    setupFailedEvent({ priceId: VALID_PRICE_YEARLY });
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionType: 'pro_yearly',
        description: expect.stringContaining('Pro Yearly'),
      }),
    );
  });

  it('should still resolve when recordTransaction fails silently', async () => {
    setupFailedEvent();
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    mockRepository.findTransactionByInvoiceId.mockResolvedValue(null);
    mockRepository.createTransaction.mockRejectedValue(
      new Error('DB write failed'),
    );

    await expect(
      webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE),
    ).resolves.toBeUndefined();
  });
});

describe('PaymentWebhookService : customer.subscription.deleted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe = { webhooks: { constructEvent: jest.fn() } };
    mockRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    webhookService = new PaymentWebhookService(
      mockRepository,
      mockStripe as unknown as Stripe,
      WEBHOOK_SECRET,
      PRICE_TO_PLAN,
    );
  });

  it('should call updateUser with correct downgrade fields and unset option', async () => {
    mockConstructEvent(buildSubscriptionEvent('customer.subscription.deleted'));
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    jest.spyOn(PaymentMapper, 'toSubscriptionCancelledResult').mockReturnValue({
      emailData: { userName: 'John Doe', email: 'test@mail.com' },
    } as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      {
        isPaid: false,
        role: 'Listener',
        'subscription.subscriptionType': 'free',
        'subscription.quota.unlimited': false,
      },
      { stripeSubscriptionId: 1 },
    );
  });

  it('should call PaymentMapper.toSubscriptionCancelledResult with the user', async () => {
    mockConstructEvent(buildSubscriptionEvent('customer.subscription.deleted'));
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    const mapperSpy = jest
      .spyOn(PaymentMapper, 'toSubscriptionCancelledResult')
      .mockReturnValue({
        emailData: { userName: 'John Doe', email: 'test@mail.com' },
      } as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mapperSpy).toHaveBeenCalledWith(fakeUser);
  });

  it('should call sendSubscriptionCancelled with userName and email from mapper', async () => {
    mockConstructEvent(buildSubscriptionEvent('customer.subscription.deleted'));
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);
    jest.spyOn(PaymentMapper, 'toSubscriptionCancelledResult').mockReturnValue({
      emailData: { userName: 'John Doe', email: 'test@mail.com' },
    } as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(emailService.sendSubscriptionCancelled).toHaveBeenCalledWith(
      'John Doe',
      'test@mail.com',
    );
  });

  it('should not call updateUser or send email when user is not found', async () => {
    mockConstructEvent(buildSubscriptionEvent('customer.subscription.deleted'));
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(null);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).not.toHaveBeenCalled();
    expect(emailService.sendSubscriptionCancelled).not.toHaveBeenCalled();
  });
});

describe('PaymentWebhookService : customer.subscription.updated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe = { webhooks: { constructEvent: jest.fn() } };
    mockRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    webhookService = new PaymentWebhookService(
      mockRepository,
      mockStripe as unknown as Stripe,
      WEBHOOK_SECRET,
      PRICE_TO_PLAN,
    );
  });

  it('should call updateUser with correct plan role and subscriptionType when priceId is known', async () => {
    mockConstructEvent(
      buildSubscriptionEvent('customer.subscription.updated', {
        priceId: VALID_PRICE_YEARLY,
      }),
    );
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);
    mockRepository.updateUser.mockResolvedValue(undefined as any);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).toHaveBeenCalledWith(
      fakeUser._id.toString(),
      {
        'subscription.subscriptionType': 'pro_yearly',
        role: 'Pro',
      },
    );
  });

  it('should not call updateUser when priceId is not in PRICE_TO_PLAN', async () => {
    mockConstructEvent(
      buildSubscriptionEvent('customer.subscription.updated', {
        priceId: UNKNOWN_PRICE_ID,
      }),
    );
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).not.toHaveBeenCalled();
  });

  it('should not call updateUser when user is not found', async () => {
    mockConstructEvent(
      buildSubscriptionEvent('customer.subscription.updated', {
        priceId: VALID_PRICE_MONTHLY,
      }),
    );
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(null);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).not.toHaveBeenCalled();
  });

  it('should not call updateUser when subscription has no items', async () => {
    mockConstructEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_test_123',
          items: { data: [] },
        } as unknown as Stripe.Subscription,
      },
    } as Stripe.Event);
    mockRepository.findUserByStripeCustomerId.mockResolvedValue(fakeUser);

    await webhookService.handleWebhook(RAW_BODY, VALID_SIGNATURE);

    expect(mockRepository.updateUser).not.toHaveBeenCalled();
  });
});
