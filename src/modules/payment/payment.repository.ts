import User, { IUser } from '../../shared/models/models.user';
import Transaction, {
  ITransaction,
  TransactionType,
} from '../../shared/models/models.transaction';
import {
  RedisObjectType,
  redisRepoCacher,
} from '../../shared/abstractions/redis/redisRepoCacher';

export interface PaymentUpdateFields {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isPaid?: boolean;
  role?: string;
  'subscription.subscriptionType'?: string;
  'subscription.quota.unlimited'?: boolean;
  'subscription.quota.leftSeconds'?: number;
  'subscription.quota.usedSeconds'?: number;
}

export interface CreateTransactionFields {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  type: TransactionType;
  amount?: number;
  currency?: string;
  subscriptionType: string;
  description: string;
}

export interface FindTransactionsResult {
  transactions: ITransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaymentRepository {
  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).lean();
  }

  async findUserByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<IUser | null> {
    return User.findOne({ stripeCustomerId }).lean();
  }

  async updateUser(
    userId: string,
    set: PaymentUpdateFields,
    unset?: Record<string, 1>,
  ): Promise<IUser | null> {
    const update: Record<string, any> = {};
    if (Object.keys(set).length) {
      update.$set = set;
    }

    if (unset && Object.keys(unset).length) {
      update.$unset = unset;
    }

    redisRepoCacher.invalidateCache(RedisObjectType.USER, userId);

    return User.findByIdAndUpdate(userId, update, { new: true }).lean();
  }

  async createTransaction(
    fields: CreateTransactionFields,
  ): Promise<ITransaction> {
    return Transaction.create(fields);
  }

  async findTransactionByInvoiceId(
    stripeInvoiceId: string,
  ): Promise<ITransaction | null> {
    return Transaction.findOne({ stripeInvoiceId }).lean();
  }

  async findTransactionsByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<FindTransactionsResult> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ userId }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
