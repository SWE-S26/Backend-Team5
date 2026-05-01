import { PaymentService } from '../../../src/modules/payment/payment.service';
import { PaymentRepository } from '../../../src/modules/payment/payment.repository';
import { PaymentWebhookService } from '../../../src/modules/payment/payment.webhook.service';
import { PaymentMapper } from '../../../src/modules/payment/dtos/payment.mapper';
import Stripe from 'stripe';
import { Types } from 'mongoose';
import { IUser } from '../../../src/shared/models/models.user';

jest.mock('../../../src/modules/payment/payment.repository');
jest.mock('../../../src/modules/payment/payment.webhook.service');
jest.mock('../../../src/shared/logger/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock('stripe');

const VALID_PRICE_MONTHLY = 'price_1TGQ4EKiCVlMQgBUJwZCK3um';
const VALID_PRICE_YEARLY = 'price_1TGj1nKiCVlMQgBU9j8T38Fr';
const VALID_PROMO_CODE = 'C0CK5';
const INVALID_PRICE_ID = 'price_invalid_000';
const INVALID_PROMO_CODE = 'BADCODE';

const fakeUser: IUser = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  email: 'test@mail.com',
  password: 'hashed_password',
  role: 'Listener',
  displayName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  city: 'Cairo',
  country: 'Egypt',
  isPrivate: false,
  bio: 'Test bio',
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

const fakeUserNoStripe: IUser = {
  ...fakeUser,
  stripeCustomerId: undefined,
  stripeSubscriptionId: undefined,
  isPaid: false,
  subscription: {
    subscriptionType: 'free',
    quota: { unlimited: false, usedSeconds: 0, leftSeconds: 3600 },
  },
};

const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

let mockStripeInstance: {
  prices: { list: jest.Mock };
  customers: { create: jest.Mock; del: jest.Mock };
  subscriptions: {
    create: jest.Mock;
    retrieve: jest.Mock;
    update: jest.Mock;
    cancel: jest.Mock;
  };
  coupons: { create: jest.Mock };
};

let paymentService: PaymentService;

describe('PaymentService : getPlanPrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should return mapped plan prices', async () => {
    const fakePrices = [{ id: VALID_PRICE_MONTHLY, unit_amount: 999 }];
    const fakeMappedResponse = [
      { priceId: VALID_PRICE_MONTHLY, label: 'Pro Monthly', amount: 999 },
    ];

    mockStripeInstance.prices.list.mockResolvedValue({ data: fakePrices });
    jest
      .spyOn(PaymentMapper, 'toGetPlanPricesResponse')
      .mockReturnValue(fakeMappedResponse as any);

    const result = await paymentService.getPlanPrices();

    expect(result).toEqual(fakeMappedResponse);
  });

  it('should call stripe.prices.list with expand product', async () => {
    mockStripeInstance.prices.list.mockResolvedValue({ data: [] });
    jest
      .spyOn(PaymentMapper, 'toGetPlanPricesResponse')
      .mockReturnValue([] as any);

    await paymentService.getPlanPrices();

    expect(mockStripeInstance.prices.list).toHaveBeenCalledWith({
      expand: ['data.product'],
    });
  });

  it('should call PaymentMapper.toGetPlanPricesResponse with stripe price data', async () => {
    const fakePrices = [{ id: VALID_PRICE_MONTHLY }];
    mockStripeInstance.prices.list.mockResolvedValue({ data: fakePrices });
    const mapperSpy = jest
      .spyOn(PaymentMapper, 'toGetPlanPricesResponse')
      .mockReturnValue([] as any);

    await paymentService.getPlanPrices();

    expect(mapperSpy).toHaveBeenCalledWith(fakePrices);
  });

  it('should throw when Stripe throws', async () => {
    mockStripeInstance.prices.list.mockRejectedValue(
      new Error('Stripe unavailable'),
    );

    await expect(paymentService.getPlanPrices()).rejects.toThrow(
      'Stripe unavailable',
    );
  });
});

describe('PaymentService : createPayingUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should return mapped response on success', async () => {
    const fakeCustomer = { id: 'cus_new_123' } as Stripe.Customer;
    const fakeMapped = { stripeCustomerId: 'cus_new_123' };

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );
    mockStripeInstance.customers.create.mockResolvedValue(fakeCustomer);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    jest
      .spyOn(PaymentMapper, 'toCreatePayingUserResponse')
      .mockReturnValue(fakeMapped as any);

    const result = await paymentService.createPayingUser('user_123', 'pm_123');

    expect(result).toEqual(fakeMapped);
  });

  it('should call stripe.customers.create with correct user data and paymentMethodId', async () => {
    const fakeCustomer = { id: 'cus_new_123' } as Stripe.Customer;

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );
    mockStripeInstance.customers.create.mockResolvedValue(fakeCustomer);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    jest
      .spyOn(PaymentMapper, 'toCreatePayingUserResponse')
      .mockReturnValue({} as any);

    await paymentService.createPayingUser('user_123', 'pm_test_456');

    expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
      email: fakeUserNoStripe.email,
      name: `${fakeUserNoStripe.firstName} ${fakeUserNoStripe.lastName}`,
      payment_method: 'pm_test_456',
      invoice_settings: { default_payment_method: 'pm_test_456' },
    });
  });

  it('should call updateUser with the new stripeCustomerId', async () => {
    const fakeCustomer = { id: 'cus_new_123' } as Stripe.Customer;

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );
    mockStripeInstance.customers.create.mockResolvedValue(fakeCustomer);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    jest
      .spyOn(PaymentMapper, 'toCreatePayingUserResponse')
      .mockReturnValue({} as any);

    await paymentService.createPayingUser('user_123', 'pm_123');

    expect(PaymentRepository.prototype.updateUser).toHaveBeenCalledWith(
      'user_123',
      {
        stripeCustomerId: 'cus_new_123',
      },
    );
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      paymentService.createPayingUser('user_123', 'pm_123'),
    ).rejects.toThrow('User not found');
  });

  it('should throw ForbiddenError when user is Admin', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue({
      ...fakeUserNoStripe,
      role: 'Admin',
    });

    await expect(
      paymentService.createPayingUser('user_123', 'pm_123'),
    ).rejects.toThrow('Admin users cannot have subscriptions');
  });

  it('should throw BadRequestError when Stripe customer creation fails', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );
    mockStripeInstance.customers.create.mockRejectedValue(
      new Error('Card declined'),
    );

    await expect(
      paymentService.createPayingUser('user_123', 'pm_123'),
    ).rejects.toThrow('Failed to process payment method');
  });

  it('should throw when findUserById throws', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockRejectedValue(
      new Error('DB is down'),
    );

    await expect(
      paymentService.createPayingUser('user_123', 'pm_123'),
    ).rejects.toThrow('DB is down');
  });
});

describe('PaymentService : createSubscription', () => {
  const fakeUserWithCustomerNoSub: IUser = {
    ...fakeUserNoStripe,
    stripeCustomerId: 'cus_test_123',
    stripeSubscriptionId: undefined,
    subscription: {
      subscriptionType: 'free',
      quota: { unlimited: false, usedSeconds: 0, leftSeconds: 3600 },
    },
  };

  const fakeSubscription = {
    id: 'sub_new_123',
    items: { data: [] },
  } as unknown as Stripe.Subscription;
  const fakeCoupon = { id: 'coupon_abc' } as Stripe.Coupon;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should return mapped result on success', async () => {
    const fakeMapped = { clientResponse: {}, emailData: {} };

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.subscriptions.create.mockResolvedValue(fakeSubscription);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCreatedResult')
      .mockReturnValue(fakeMapped as any);

    const result = await paymentService.createSubscription(
      'user_123',
      VALID_PRICE_MONTHLY,
    );

    expect(result).toEqual(fakeMapped);
  });

  it('should call stripe.subscriptions.create with correct customer and priceId', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.subscriptions.create.mockResolvedValue(fakeSubscription);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCreatedResult')
      .mockReturnValue({} as any);

    await paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY);

    expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test_123',
        items: [{ price: VALID_PRICE_MONTHLY }],
      }),
    );
  });

  it('should create a coupon and attach it when a valid promo code is provided', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.coupons.create.mockResolvedValue(fakeCoupon);
    mockStripeInstance.subscriptions.create.mockResolvedValue(fakeSubscription);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCreatedResult')
      .mockReturnValue({} as any);

    await paymentService.createSubscription(
      'user_123',
      VALID_PRICE_MONTHLY,
      VALID_PROMO_CODE,
    );

    expect(mockStripeInstance.coupons.create).toHaveBeenCalledWith({
      percent_off: 69,
      duration: 'once',
    });
    expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        discounts: [{ coupon: 'coupon_abc' }],
      }),
    );
  });

  it('should not create a coupon when no promo code is provided', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.subscriptions.create.mockResolvedValue(fakeSubscription);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCreatedResult')
      .mockReturnValue({} as any);

    await paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY);

    expect(mockStripeInstance.coupons.create).not.toHaveBeenCalled();
  });

  it('should call updateUser with correct subscription fields after creation', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.subscriptions.create.mockResolvedValue(fakeSubscription);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCreatedResult')
      .mockReturnValue({} as any);

    await paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY);

    expect(PaymentRepository.prototype.updateUser).toHaveBeenCalledWith(
      'user_123',
      expect.objectContaining({
        stripeSubscriptionId: 'sub_new_123',
        isPaid: true,
        role: 'Pro',
        'subscription.subscriptionType': 'pro_monthly',
        'subscription.quota.unlimited': true,
      }),
    );
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY),
    ).rejects.toThrow('User not found');
  });

  it('should throw BadRequestError when stripeCustomerId is missing', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );

    await expect(
      paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY),
    ).rejects.toThrow('Stripe customer ID is required');
  });

  it('should throw BadRequestError when priceId is invalid', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );

    await expect(
      paymentService.createSubscription('user_123', INVALID_PRICE_ID),
    ).rejects.toThrow('Invalid price ID');
  });

  it('should throw BadRequestError when promo code is invalid', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );

    await expect(
      paymentService.createSubscription(
        'user_123',
        VALID_PRICE_MONTHLY,
        INVALID_PROMO_CODE,
      ),
    ).rejects.toThrow('Invalid promo code');
  });

  it('should throw BadRequestError when user already has an active subscription', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );

    await expect(
      paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY),
    ).rejects.toThrow('User already has an active subscription');
  });

  it('should throw BadRequestError when Stripe subscription creation fails', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.subscriptions.create.mockRejectedValue(
      new Error('No payment method'),
    );

    await expect(
      paymentService.createSubscription('user_123', VALID_PRICE_MONTHLY),
    ).rejects.toThrow(
      'Failed to create Stripe subscription: No payment method',
    );
  });

  it('should still return successfully when recordTransaction fails silently', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserWithCustomerNoSub,
    );
    mockStripeInstance.subscriptions.create.mockResolvedValue(fakeSubscription);
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockRejectedValue(new Error('DB write failed'));
    const fakeMapped = { clientResponse: {}, emailData: {} };
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCreatedResult')
      .mockReturnValue(fakeMapped as any);

    const result = await paymentService.createSubscription(
      'user_123',
      VALID_PRICE_MONTHLY,
    );

    expect(result).toEqual(fakeMapped);
  });
});

describe('PaymentService : getSubscription', () => {
  const fakeStripeSubscription = {
    id: 'sub_test_123',
    status: 'active',
  } as Stripe.Subscription;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should return mapped subscription on success', async () => {
    const fakeMapped = { subscriptionId: 'sub_test_123', status: 'active' };

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    jest
      .spyOn(PaymentMapper, 'toGetSubscriptionResponse')
      .mockReturnValue(fakeMapped as any);

    const result = await paymentService.getSubscription('user_123');

    expect(result).toEqual(fakeMapped);
  });

  it('should call stripe.subscriptions.retrieve with the user stripeSubscriptionId', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    jest
      .spyOn(PaymentMapper, 'toGetSubscriptionResponse')
      .mockReturnValue({} as any);

    await paymentService.getSubscription('user_123');

    expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith(
      'sub_test_123',
    );
  });

  it('should call PaymentMapper.toGetSubscriptionResponse with user and subscription', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    const mapperSpy = jest
      .spyOn(PaymentMapper, 'toGetSubscriptionResponse')
      .mockReturnValue({} as any);

    await paymentService.getSubscription('user_123');

    expect(mapperSpy).toHaveBeenCalledWith(fakeUser, fakeStripeSubscription);
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(paymentService.getSubscription('user_123')).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw NotFoundError when user has no stripeSubscriptionId', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );

    await expect(paymentService.getSubscription('user_123')).rejects.toThrow(
      'Subscription not found',
    );
  });

  it('should throw when Stripe retrieve throws', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.retrieve.mockRejectedValue(
      new Error('Stripe error'),
    );

    await expect(paymentService.getSubscription('user_123')).rejects.toThrow(
      'Stripe error',
    );
  });
});

describe('PaymentService : updateSubscription', () => {
  const fakeUserOnMonthly: IUser = {
    ...fakeUser,
    subscription: {
      subscriptionType: 'pro_monthly',
      quota: { unlimited: true, usedSeconds: 0, leftSeconds: 0 },
    },
  };

  const fakeStripeSubscription = {
    id: 'sub_test_123',
    items: { data: [{ id: 'si_existing_item' }] },
  } as unknown as Stripe.Subscription;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should return mapped result on success', async () => {
    const fakeMapped = {
      emailData: {
        userName: 'John',
        email: 'john@mail.com',
        planName: 'Pro Yearly',
        oldPlanName: 'Pro Monthly',
      },
    };

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserOnMonthly,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    mockStripeInstance.subscriptions.update.mockResolvedValue({});
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionUpdatedResult')
      .mockReturnValue(fakeMapped as any);

    const result = await paymentService.updateSubscription(
      'user_123',
      VALID_PRICE_YEARLY,
    );

    expect(result).toEqual(fakeMapped);
  });

  it('should call stripe.subscriptions.update with the correct item and proration', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserOnMonthly,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    mockStripeInstance.subscriptions.update.mockResolvedValue({});
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionUpdatedResult')
      .mockReturnValue({} as any);

    await paymentService.updateSubscription('user_123', VALID_PRICE_YEARLY);

    expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith(
      'sub_test_123',
      {
        items: [{ id: 'si_existing_item', price: VALID_PRICE_YEARLY }],
        proration_behavior: 'create_prorations',
      },
    );
  });

  it('should call updateUser with the new plan role and subscriptionType', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserOnMonthly,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    mockStripeInstance.subscriptions.update.mockResolvedValue({});
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionUpdatedResult')
      .mockReturnValue({} as any);

    await paymentService.updateSubscription('user_123', VALID_PRICE_YEARLY);

    expect(PaymentRepository.prototype.updateUser).toHaveBeenCalledWith(
      'user_123',
      {
        role: 'Pro',
        'subscription.subscriptionType': 'pro_yearly',
        'subscription.quota.unlimited': true,
      },
    );
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      paymentService.updateSubscription('user_123', VALID_PRICE_YEARLY),
    ).rejects.toThrow('User not found');
  });

  it('should throw BadRequestError when priceId is invalid', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserOnMonthly,
    );

    await expect(
      paymentService.updateSubscription('user_123', INVALID_PRICE_ID),
    ).rejects.toThrow('Invalid price ID');
  });

  it('should throw BadRequestError when stripeCustomerId is missing', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );

    await expect(
      paymentService.updateSubscription('user_123', VALID_PRICE_YEARLY),
    ).rejects.toThrow('Stripe customer ID is required');
  });

  it('should throw NotFoundError when stripeSubscriptionId is missing', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue({
      ...fakeUserOnMonthly,
      stripeSubscriptionId: undefined,
    });

    await expect(
      paymentService.updateSubscription('user_123', VALID_PRICE_YEARLY),
    ).rejects.toThrow('Subscription not found');
  });

  it('should throw BadRequestError when user is already on the target plan', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserOnMonthly,
    );

    await expect(
      paymentService.updateSubscription('user_123', VALID_PRICE_MONTHLY),
    ).rejects.toThrow('You are already subscribed to this plan');
  });

  it('should throw BadRequestError when Stripe subscription update fails', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserOnMonthly,
    );
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(
      fakeStripeSubscription,
    );
    mockStripeInstance.subscriptions.update.mockRejectedValue(
      new Error('Stripe update error'),
    );

    await expect(
      paymentService.updateSubscription('user_123', VALID_PRICE_YEARLY),
    ).rejects.toThrow(
      'Failed to update Stripe subscription: Stripe update error',
    );
  });
});

describe('PaymentService : cancelSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should call stripe.subscriptions.update with cancel_at_period_end when cancelAtPeriodEnd is true', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.update.mockResolvedValue({});
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCancelledResult')
      .mockReturnValue({} as any);

    await paymentService.cancelSubscription('user_123', true);

    expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith(
      'sub_test_123',
      { cancel_at_period_end: true },
    );
    expect(mockStripeInstance.subscriptions.cancel).not.toHaveBeenCalled();
  });

  it('should call stripe.subscriptions.cancel immediately when cancelAtPeriodEnd is false', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.cancel.mockResolvedValue({});
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCancelledResult')
      .mockReturnValue({} as any);

    await paymentService.cancelSubscription('user_123', false);

    expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith(
      'sub_test_123',
    );
    expect(mockStripeInstance.subscriptions.update).not.toHaveBeenCalled();
  });

  it('should call updateUser to downgrade when cancelAtPeriodEnd is false', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.cancel.mockResolvedValue({});
    (PaymentRepository.prototype.updateUser as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCancelledResult')
      .mockReturnValue({} as any);

    await paymentService.cancelSubscription('user_123', false);

    expect(PaymentRepository.prototype.updateUser).toHaveBeenCalledWith(
      'user_123',
      {
        isPaid: false,
        role: 'Listener',
        'subscription.subscriptionType': 'free',
        'subscription.quota.unlimited': false,
      },
      { stripeSubscriptionId: 1 },
    );
  });

  it('should NOT call updateUser when cancelAtPeriodEnd is true', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.update.mockResolvedValue({});
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCancelledResult')
      .mockReturnValue({} as any);

    await paymentService.cancelSubscription('user_123', true);

    expect(PaymentRepository.prototype.updateUser).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      paymentService.cancelSubscription('user_123', true),
    ).rejects.toThrow('User not found');
  });

  it('should throw BadRequestError when stripeCustomerId is missing', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUserNoStripe,
    );

    await expect(
      paymentService.cancelSubscription('user_123', true),
    ).rejects.toThrow('Stripe customer ID is required');
  });

  it('should throw NotFoundError when stripeSubscriptionId is missing', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      stripeSubscriptionId: undefined,
    });

    await expect(
      paymentService.cancelSubscription('user_123', true),
    ).rejects.toThrow('Subscription not found');
  });

  it('should throw ForbiddenError when user has more than 3 tracks', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      tracks: [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ],
    });

    await expect(
      paymentService.cancelSubscription('user_123', true),
    ).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining('tracks') }),
    );
  });

  it('should throw ForbiddenError when user has more than 2 playlists', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      playlists: [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ],
    });

    await expect(
      paymentService.cancelSubscription('user_123', true),
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('playlists'),
      }),
    );
  });

  it('should return mapped result on success', async () => {
    const fakeMapped = {
      emailData: { userName: 'John', email: 'john@mail.com' },
    };

    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    mockStripeInstance.subscriptions.update.mockResolvedValue({});
    (
      PaymentRepository.prototype.createTransaction as jest.Mock
    ).mockResolvedValue(undefined);
    jest
      .spyOn(PaymentMapper, 'toSubscriptionCancelledResult')
      .mockReturnValue(fakeMapped as any);

    const result = await paymentService.cancelSubscription('user_123', true);

    expect(result).toEqual(fakeMapped);
  });
});

describe('PaymentService : deleteStripeCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should call stripe.customers.del with correct customerId', async () => {
    mockStripeInstance.customers.del.mockResolvedValue({
      id: 'cus_test_123',
      deleted: true,
    });

    await paymentService.deleteStripeCustomer('cus_test_123');

    expect(mockStripeInstance.customers.del).toHaveBeenCalledWith(
      'cus_test_123',
    );
  });

  it('should resolve without returning a value on success', async () => {
    mockStripeInstance.customers.del.mockResolvedValue({
      id: 'cus_test_123',
      deleted: true,
    });

    const result = await paymentService.deleteStripeCustomer('cus_test_123');

    expect(result).toBeUndefined();
  });

  it('should throw BadRequestError when Stripe deletion fails', async () => {
    mockStripeInstance.customers.del.mockRejectedValue(
      new Error('Customer not found'),
    );

    await expect(
      paymentService.deleteStripeCustomer('cus_test_123'),
    ).rejects.toThrow('Failed to delete Stripe customer: Customer not found');
  });
});

describe('PaymentService : getTransactionHistory', () => {
  const fakeTransactions = {
    transactions: [{ id: 'txn_1', type: 'payment_succeeded', amount: 999 }],
    total: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should return transaction history on success', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    (
      PaymentRepository.prototype.findTransactionsByUserId as jest.Mock
    ).mockResolvedValue(fakeTransactions);

    const result = await paymentService.getTransactionHistory(
      'user_123',
      1,
      10,
    );

    expect(result).toEqual(fakeTransactions);
  });

  it('should call findTransactionsByUserId with correct userId, page, and limit', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    (
      PaymentRepository.prototype.findTransactionsByUserId as jest.Mock
    ).mockResolvedValue(fakeTransactions);

    await paymentService.getTransactionHistory('user_123', 2, 20);

    expect(
      PaymentRepository.prototype.findTransactionsByUserId,
    ).toHaveBeenCalledWith('user_123', 2, 20);
  });

  it('should throw NotFoundError when user does not exist', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      paymentService.getTransactionHistory('user_123', 1, 10),
    ).rejects.toThrow('User not found');
  });

  it('should throw ForbiddenError when user is Admin', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue({
      ...fakeUser,
      role: 'Admin',
    });

    await expect(
      paymentService.getTransactionHistory('user_123', 1, 10),
    ).rejects.toThrow('Admin users cannot have subscriptions');
  });

  it('should throw when repository throws', async () => {
    (PaymentRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      fakeUser,
    );
    (
      PaymentRepository.prototype.findTransactionsByUserId as jest.Mock
    ).mockRejectedValue(new Error('DB is down'));

    await expect(
      paymentService.getTransactionHistory('user_123', 1, 10),
    ).rejects.toThrow('DB is down');
  });
});

describe('PaymentService : handleWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      prices: { list: jest.fn() },
      customers: { create: jest.fn(), del: jest.fn() },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      coupons: { create: jest.fn() },
    };
    MockedStripe.mockImplementation(
      () => mockStripeInstance as unknown as Stripe,
    );
    paymentService = new PaymentService();
  });

  it('should delegate to webhookHandler.handleWebhook with rawBody and signature', async () => {
    const rawBody = Buffer.from('{"type":"invoice.paid"}');
    const signature = 'stripe_sig_abc';

    (
      PaymentWebhookService.prototype.handleWebhook as jest.Mock
    ).mockResolvedValue(undefined);

    await paymentService.handleWebhook(rawBody, signature);

    expect(PaymentWebhookService.prototype.handleWebhook).toHaveBeenCalledWith(
      rawBody,
      signature,
    );
  });

  it('should resolve without returning a value on success', async () => {
    (
      PaymentWebhookService.prototype.handleWebhook as jest.Mock
    ).mockResolvedValue(undefined);

    const result = await paymentService.handleWebhook(
      Buffer.from(''),
      'sig_123',
    );

    expect(result).toBeUndefined();
  });

  it('should throw when webhookHandler throws', async () => {
    (
      PaymentWebhookService.prototype.handleWebhook as jest.Mock
    ).mockRejectedValue(new Error('Invalid Stripe webhook signature'));

    await expect(
      paymentService.handleWebhook(Buffer.from(''), 'bad_sig'),
    ).rejects.toThrow('Invalid Stripe webhook signature');
  });
});
