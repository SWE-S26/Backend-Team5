import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { PaymentService } from './payment.service';
import {
  CancelSubscriptionRequestDTO,
  CreatePayingUserRequestDTO,
  CreateSubscriptionRequestDTO,
  UpdateSubscriptionRequestDTO,
} from './dtos/payment.request';
import { BadRequestError } from '../../shared/errors/responseErrors';

export class PaymentController {
  private readonly service: PaymentService;

  constructor() {
    this.service = new PaymentService();
  }

  async getPaymentPlans(req: Request, res: Response): Promise<void> {
    const planPrices = await this.service.getPlanPrices();
    res.status(200).json({
      success: true,
      message: 'Payment plans retrieved successfully',
      data: planPrices,
    });
  }

  async createPayingUser(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(CreatePayingUserRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const paymentMethodId = validatedRequest.data.body.paymentMethodId;

    const customerId = await this.service.createPayingUser(
      userId,
      paymentMethodId,
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { userId: customerId },
    });
  }

  async createSubscription(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(CreateSubscriptionRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = req.userInfo!._id;
    const { priceId } = validatedRequest.data.body;

    const subscriptionId = await this.service.createSubscription(
      userId,
      priceId,
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscriptionId },
    });
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const data = await this.service.getSubscription(userId);
    res.status(200).json({
      success: true,
      message: 'Subscription retrieved successfully',
      data,
    });
  }

  async updateSubscription(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(UpdateSubscriptionRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = req.userInfo!._id;
    const { priceId } = validatedRequest.data.body;

    await this.service.updateSubscription(userId, priceId);
    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: null,
    });
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(CancelSubscriptionRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = req.userInfo!._id;
    const { cancelAtPeriodEnd } = validatedRequest.data.body;

    await this.service.cancelSubscription(userId, cancelAtPeriodEnd ?? true);
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: null,
    });
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      throw BadRequestError('Missing or invalid Stripe signature header');
    }

    if (!Buffer.isBuffer(req.rawBody)) {
      throw BadRequestError('Invalid request body — raw body required');
    }

    await this.service.handleWebhook(req.rawBody, signature);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: null,
    });
  }
}
