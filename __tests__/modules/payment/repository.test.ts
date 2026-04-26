import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';

import User from '../../../src/shared/models/models.user';
import Transaction from '../../../src/shared/models/models.transaction';

import {
  PaymentRepository,
  CreateTransactionFields,
} from '../../../src/modules/payment/payment.repository';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.transaction');

const paymentRepository = new PaymentRepository();

const userId = new Types.ObjectId().toString();

const fakeUser = {
  _id: userId,
  email: 'test@mail.com',
  stripeCustomerId: 'cus_123',
};

const fakeTransaction = {
  _id: new Types.ObjectId(),
  userId,
  stripeInvoiceId: 'inv_123',
  amount: 100,
  createdAt: new Date(),
};

describe('PaymentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeUser),
      });

      const result = await paymentRepository.findUserById(userId);

      expect(result).toEqual(fakeUser);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null if user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await paymentRepository.findUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findUserByStripeCustomerId', () => {
    it('should return user', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeUser),
      });

      const result =
        await paymentRepository.findUserByStripeCustomerId('cus_123');

      expect(result).toEqual(fakeUser);
      expect(User.findOne).toHaveBeenCalledWith({
        stripeCustomerId: 'cus_123',
      });
    });
  });

  describe('updateUser', () => {
    it('should update with $set only', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeUser),
      });

      const result = await paymentRepository.updateUser(userId, {
        isPaid: true,
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { isPaid: true } },
        { new: true },
      );

      expect(result).toEqual(fakeUser);
    });

    it('should update with $set and $unset', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeUser),
      });

      const result = await paymentRepository.updateUser(
        userId,
        { isPaid: true },
        { stripeSubscriptionId: 1 },
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          $set: { isPaid: true },
          $unset: { stripeSubscriptionId: 1 },
        },
        { new: true },
      );

      expect(result).toEqual(fakeUser);
    });

    it('should handle empty set', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeUser),
      });

      await paymentRepository.updateUser(userId, {});

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {},
        { new: true },
      );
    });
  });

  describe('createTransaction', () => {
    it('should create transaction', async () => {
      const fields: CreateTransactionFields = {
        userId,
        stripeCustomerId: 'cus_123',
        type: 'payment' as any,
        subscriptionType: 'pro',
        description: 'Test payment',
      };

      (Transaction.create as jest.Mock).mockResolvedValue(fakeTransaction);

      const result = await paymentRepository.createTransaction(fields);

      expect(result).toEqual(fakeTransaction);
      expect(Transaction.create).toHaveBeenCalledWith(fields);
    });
  });

  describe('findTransactionByInvoiceId', () => {
    it('should return transaction', async () => {
      (Transaction.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeTransaction),
      });

      const result =
        await paymentRepository.findTransactionByInvoiceId('inv_123');

      expect(result).toEqual(fakeTransaction);
      expect(Transaction.findOne).toHaveBeenCalledWith({
        stripeInvoiceId: 'inv_123',
      });
    });

    it('should return null if not found', async () => {
      (Transaction.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result =
        await paymentRepository.findTransactionByInvoiceId('inv_404');

      expect(result).toBeNull();
    });
  });

  describe('findTransactionsByUserId', () => {
    it('should return paginated transactions', async () => {
      const transactions = [fakeTransaction];

      (Transaction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(transactions),
      });

      (Transaction.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await paymentRepository.findTransactionsByUserId(
        userId,
        1,
        10,
      );

      expect(result).toEqual({
        transactions,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(Transaction.find).toHaveBeenCalledWith({ userId });
    });
  });
});
