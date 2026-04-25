import { Schema, Types, model } from 'mongoose';

export type TransactionType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_succeeded'
  | 'payment_failed';

export type ITransaction = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripeInvoiceId: string | null;
  type: TransactionType;
  discountPercent?: number | null;
  amount: number;
  currency: string;
  subscriptionType: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    stripeInvoiceId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    type: {
      type: String,
      enum: [
        'subscription_created',
        'subscription_updated',
        'subscription_cancelled',
        'payment_succeeded',
        'payment_failed',
      ],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
      trim: true,
    },
    discountPercent: {
      type: Number,
      default: null,
    },
    subscriptionType: {
      type: String,
      default: 'unknown',
    },
    description: {
      type: String,
      default: '',
      maxlength: 255,
    },
  },
  { timestamps: true },
);

const Transaction = model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
