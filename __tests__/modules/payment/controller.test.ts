import { PaymentController } from '../../../src/modules/payment/payment.controller';
import { PaymentService } from '../../../src/modules/payment/payment.service';
import { Request, Response } from 'express';
import emailService from '../../../src/shared/abstractions/email/email.service';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/modules/payment/payment.service');
jest.mock('../../../src/shared/abstractions/email/email.service');
jest.mock('../../../src/shared/dtos/requestParser');

const fakePlanPrices = [
  { priceId: 'price_123', label: 'Pro Monthly', amount: 999, currency: 'usd' },
];

const fakePayingUserResponse = {
  stripeCustomerId: 'cus_123',
  clientSecret: 'cs_test_123',
};

const fakeSubscriptionResponse = {
  subscriptionId: 'sub_123',
  status: 'active',
  currentPeriodEnd: new Date('2026-05-26'),
};

const fakeEmailData = {
  userName: 'John Doe',
  email: 'john@example.com',
  planName: 'Pro Monthly',
  oldPlanName: 'Basic Monthly',
};

const fakeTransactionHistory = {
  transactions: [
    {
      id: 'txn_1',
      type: 'payment_succeeded',
      amount: 999,
      currency: 'usd',
      createdAt: new Date(),
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
};

function mockParseSuccess(body: object = {}, query: object = {}): void {
  (parseRequest as jest.Mock).mockReturnValue({
    success: true,
    data: { body, query },
  });
}

function mockParseFailure(message = 'Validation error'): void {
  (parseRequest as jest.Mock).mockReturnValue({
    success: false,
    error: new Error(message),
  });
}

let paymentController: PaymentController;
let mockRes: Partial<Response>;

describe('PaymentController : getPaymentPlans', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq: Partial<Request> = { body: {}, query: {}, params: {} };

  it('should return payment plans on success', async () => {
    (PaymentService.prototype.getPlanPrices as jest.Mock).mockResolvedValue(
      fakePlanPrices,
    );

    await paymentController.getPaymentPlans(
      mockReq as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Payment plans retrieved successfully',
      data: fakePlanPrices,
    });
  });

  it('should call getPlanPrices once', async () => {
    (PaymentService.prototype.getPlanPrices as jest.Mock).mockResolvedValue(
      fakePlanPrices,
    );

    await paymentController.getPaymentPlans(
      mockReq as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.getPlanPrices).toHaveBeenCalledTimes(1);
  });

  it('should throw when service throws', async () => {
    (PaymentService.prototype.getPlanPrices as jest.Mock).mockRejectedValue(
      new Error('Stripe unavailable'),
    );

    await expect(
      paymentController.getPaymentPlans(
        mockReq as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Stripe unavailable');
  });
});

describe('PaymentController : createPayingUser', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { paymentMethodId: 'pm_123' },
    query: {},
    params: {},
    userInfo: { _id: 'user_123' },
  };

  it('should return 201 with data on success', async () => {
    mockParseSuccess({ paymentMethodId: 'pm_123' });
    (PaymentService.prototype.createPayingUser as jest.Mock).mockResolvedValue(
      fakePayingUserResponse,
    );

    await paymentController.createPayingUser(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'User created successfully',
      data: fakePayingUserResponse,
    });
  });

  it('should call createPayingUser with correct userId and paymentMethodId', async () => {
    mockParseSuccess({ paymentMethodId: 'pm_123' });
    (PaymentService.prototype.createPayingUser as jest.Mock).mockResolvedValue(
      fakePayingUserResponse,
    );

    await paymentController.createPayingUser(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.createPayingUser).toHaveBeenCalledWith(
      'user_123',
      'pm_123',
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('paymentMethodId is required');

    await expect(
      paymentController.createPayingUser(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('paymentMethodId is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ paymentMethodId: 'pm_123' });
    (PaymentService.prototype.createPayingUser as jest.Mock).mockRejectedValue(
      new Error('Customer already exists'),
    );

    await expect(
      paymentController.createPayingUser(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Customer already exists');
  });
});

describe('PaymentController : createSubscription', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { priceId: 'price_123', promoCode: 'PROMO10' },
    query: {},
    params: {},
    userInfo: { _id: 'user_123' },
  };

  it('should return 201 with client response on success', async () => {
    mockParseSuccess({ priceId: 'price_123', promoCode: 'PROMO10' });
    (
      PaymentService.prototype.createSubscription as jest.Mock
    ).mockResolvedValue({
      clientResponse: fakeSubscriptionResponse,
      emailData: fakeEmailData,
    });

    await paymentController.createSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Subscription created successfully',
      data: fakeSubscriptionResponse,
    });
  });

  it('should call createSubscription with correct userId, priceId and promoCode', async () => {
    mockParseSuccess({ priceId: 'price_123', promoCode: 'PROMO10' });
    (
      PaymentService.prototype.createSubscription as jest.Mock
    ).mockResolvedValue({
      clientResponse: fakeSubscriptionResponse,
      emailData: fakeEmailData,
    });

    await paymentController.createSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.createSubscription).toHaveBeenCalledWith(
      'user_123',
      'price_123',
      'PROMO10',
    );
  });

  it('should call sendSubscriptionCreated with correct args', async () => {
    mockParseSuccess({ priceId: 'price_123', promoCode: 'PROMO10' });
    (
      PaymentService.prototype.createSubscription as jest.Mock
    ).mockResolvedValue({
      clientResponse: fakeSubscriptionResponse,
      emailData: fakeEmailData,
    });

    await paymentController.createSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(emailService.sendSubscriptionCreated).toHaveBeenCalledWith(
      fakeEmailData.userName,
      fakeEmailData.email,
      fakeEmailData.planName,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('priceId is required');

    await expect(
      paymentController.createSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('priceId is required');
  });

  it('should not send email when service throws', async () => {
    mockParseSuccess({ priceId: 'price_123' });
    (
      PaymentService.prototype.createSubscription as jest.Mock
    ).mockRejectedValue(new Error('Stripe error'));

    await expect(
      paymentController.createSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Stripe error');

    expect(emailService.sendSubscriptionCreated).not.toHaveBeenCalled();
  });
});

describe('PaymentController : getSubscription', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: {},
    userInfo: { _id: 'user_123' },
  };

  it('should return subscription data on success', async () => {
    (PaymentService.prototype.getSubscription as jest.Mock).mockResolvedValue(
      fakeSubscriptionResponse,
    );

    await paymentController.getSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Subscription retrieved successfully',
      data: fakeSubscriptionResponse,
    });
  });

  it('should call getSubscription with correct userId', async () => {
    (PaymentService.prototype.getSubscription as jest.Mock).mockResolvedValue(
      fakeSubscriptionResponse,
    );

    await paymentController.getSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.getSubscription).toHaveBeenCalledWith(
      'user_123',
    );
  });

  it('should throw when service throws', async () => {
    (PaymentService.prototype.getSubscription as jest.Mock).mockRejectedValue(
      new Error('Subscription not found'),
    );

    await expect(
      paymentController.getSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Subscription not found');
  });
});

describe('PaymentController : updateSubscription', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { priceId: 'price_456' },
    query: {},
    params: {},
    userInfo: { _id: 'user_123' },
  };

  it('should return success response on update', async () => {
    mockParseSuccess({ priceId: 'price_456' });
    (
      PaymentService.prototype.updateSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.updateSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Subscription updated successfully',
      data: null,
    });
  });

  it('should call updateSubscription with correct userId and priceId', async () => {
    mockParseSuccess({ priceId: 'price_456' });
    (
      PaymentService.prototype.updateSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.updateSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.updateSubscription).toHaveBeenCalledWith(
      'user_123',
      'price_456',
    );
  });

  it('should call sendSubscriptionUpdated with correct args', async () => {
    mockParseSuccess({ priceId: 'price_456' });
    (
      PaymentService.prototype.updateSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.updateSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(emailService.sendSubscriptionUpdated).toHaveBeenCalledWith(
      fakeEmailData.userName,
      fakeEmailData.email,
      fakeEmailData.oldPlanName,
      fakeEmailData.planName,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('priceId is required');

    await expect(
      paymentController.updateSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('priceId is required');
  });

  it('should not send email when service throws', async () => {
    mockParseSuccess({ priceId: 'price_456' });
    (
      PaymentService.prototype.updateSubscription as jest.Mock
    ).mockRejectedValue(new Error('No active subscription'));

    await expect(
      paymentController.updateSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('No active subscription');

    expect(emailService.sendSubscriptionUpdated).not.toHaveBeenCalled();
  });
});

describe('PaymentController : cancelSubscription', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { cancelAtPeriodEnd: true },
    query: {},
    params: {},
    userInfo: { _id: 'user_123' },
  };

  it('should return success response on cancel', async () => {
    mockParseSuccess({ cancelAtPeriodEnd: true });
    (
      PaymentService.prototype.cancelSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.cancelSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Subscription cancelled successfully',
      data: null,
    });
  });

  it('should call cancelSubscription with correct userId and cancelAtPeriodEnd', async () => {
    mockParseSuccess({ cancelAtPeriodEnd: true });
    (
      PaymentService.prototype.cancelSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.cancelSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.cancelSubscription).toHaveBeenCalledWith(
      'user_123',
      true,
    );
  });

  it('should default cancelAtPeriodEnd to true when not provided', async () => {
    mockParseSuccess({});
    (
      PaymentService.prototype.cancelSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.cancelSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.cancelSubscription).toHaveBeenCalledWith(
      'user_123',
      true,
    );
  });

  it('should call sendSubscriptionCancelled with correct args', async () => {
    mockParseSuccess({ cancelAtPeriodEnd: true });
    (
      PaymentService.prototype.cancelSubscription as jest.Mock
    ).mockResolvedValue({ emailData: fakeEmailData });

    await paymentController.cancelSubscription(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(emailService.sendSubscriptionCancelled).toHaveBeenCalledWith(
      fakeEmailData.userName,
      fakeEmailData.email,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('Validation error');

    await expect(
      paymentController.cancelSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Validation error');
  });

  it('should not send email when service throws', async () => {
    mockParseSuccess({ cancelAtPeriodEnd: true });
    (
      PaymentService.prototype.cancelSubscription as jest.Mock
    ).mockRejectedValue(new Error('No active subscription'));

    await expect(
      paymentController.cancelSubscription(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('No active subscription');

    expect(emailService.sendSubscriptionCancelled).not.toHaveBeenCalled();
  });
});

describe('PaymentController : getTransactions', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { page: 1, limit: 10 },
    params: {},
    userInfo: { _id: 'user_123' },
  };

  it('should return transaction history on success', async () => {
    mockParseSuccess({}, { page: 1, limit: 10 });
    (
      PaymentService.prototype.getTransactionHistory as jest.Mock
    ).mockResolvedValue(fakeTransactionHistory);

    await paymentController.getTransactions(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Transaction history retrieved successfully',
      data: fakeTransactionHistory,
    });
  });

  it('should call getTransactionHistory with correct userId, page and limit', async () => {
    mockParseSuccess({}, { page: 1, limit: 10 });
    (
      PaymentService.prototype.getTransactionHistory as jest.Mock
    ).mockResolvedValue(fakeTransactionHistory);

    await paymentController.getTransactions(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.getTransactionHistory).toHaveBeenCalledWith(
      'user_123',
      1,
      10,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('page must be a number');

    await expect(
      paymentController.getTransactions(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('page must be a number');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({}, { page: 1, limit: 10 });
    (
      PaymentService.prototype.getTransactionHistory as jest.Mock
    ).mockRejectedValue(new Error('DB is down'));

    await expect(
      paymentController.getTransactions(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('DB is down');
  });
});

describe('PaymentController : handleWebhook', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const validSignature = 'stripe_sig_abc123';
  const rawBody = Buffer.from('{"type":"invoice.paid"}');

  it('should return success response when webhook is processed', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'stripe-signature': validSignature },
      rawBody,
    };

    (PaymentService.prototype.handleWebhook as jest.Mock).mockResolvedValue(
      undefined,
    );

    await paymentController.handleWebhook(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Webhook processed successfully',
      data: null,
    });
  });

  it('should call handleWebhook service with rawBody and signature', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'stripe-signature': validSignature },
      rawBody,
    };

    (PaymentService.prototype.handleWebhook as jest.Mock).mockResolvedValue(
      undefined,
    );

    await paymentController.handleWebhook(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PaymentService.prototype.handleWebhook).toHaveBeenCalledWith(
      rawBody,
      validSignature,
    );
  });

  it('should throw BadRequestError when stripe-signature header is missing', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
      rawBody,
    };

    await expect(
      paymentController.handleWebhook(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Missing or invalid Stripe signature header');
  });

  it('should throw BadRequestError when stripe-signature header is an array', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'stripe-signature': ['sig1', 'sig2'] },
      rawBody,
    };

    await expect(
      paymentController.handleWebhook(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Missing or invalid Stripe signature header');
  });

  it('should throw BadRequestError when rawBody is not a Buffer', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'stripe-signature': validSignature },
      rawBody: '{"type":"invoice.paid"}',
    };

    await expect(
      paymentController.handleWebhook(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Invalid request body — raw body required');
  });

  it('should throw when service throws', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
      headers: { 'stripe-signature': validSignature },
      rawBody,
    };

    (PaymentService.prototype.handleWebhook as jest.Mock).mockRejectedValue(
      new Error('Invalid Stripe webhook signature'),
    );

    await expect(
      paymentController.handleWebhook(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Invalid Stripe webhook signature');
  });
});

describe('PaymentController : removeStripeCustomer', () => {
  beforeEach(() => {
    paymentController = new PaymentController();
    jest.clearAllMocks();
  });

  it('should call deleteStripeCustomer with correct stripeCustomerId', async () => {
    (
      PaymentService.prototype.deleteStripeCustomer as jest.Mock
    ).mockResolvedValue(undefined);

    await paymentController.removeStripeCustomer('cus_123');

    expect(PaymentService.prototype.deleteStripeCustomer).toHaveBeenCalledWith(
      'cus_123',
    );
  });

  it('should resolve without returning a value', async () => {
    (
      PaymentService.prototype.deleteStripeCustomer as jest.Mock
    ).mockResolvedValue(undefined);

    const result = await paymentController.removeStripeCustomer('cus_123');

    expect(result).toBeUndefined();
  });

  it('should throw when service throws', async () => {
    (
      PaymentService.prototype.deleteStripeCustomer as jest.Mock
    ).mockRejectedValue(new Error('Customer not found in Stripe'));

    await expect(
      paymentController.removeStripeCustomer('cus_123'),
    ).rejects.toThrow('Customer not found in Stripe');
  });
});
