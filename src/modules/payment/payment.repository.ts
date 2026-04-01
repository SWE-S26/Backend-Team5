import User, { IUser } from '../../shared/models/models.user';
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
}
