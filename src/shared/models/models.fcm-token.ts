import { Schema, Types, model } from 'mongoose';

export type IFcmToken = {
  userId: Types.ObjectId;
  token: string;
  platform: 'ios' | 'android';
  createdAt: Date;
};

const fcmTokenSchema = new Schema<IFcmToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android'],
      required: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

const FcmToken = model<IFcmToken>('FcmToken', fcmTokenSchema);
export default FcmToken;
