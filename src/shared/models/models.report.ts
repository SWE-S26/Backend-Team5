import { Schema, Types, model } from 'mongoose';

export type IReport = {
  reporterId: Types.ObjectId;
  violatorId: Types.ObjectId;
  reason: string;
  violatorType: 'user' | 'track';
  status: 'pending' | 'done';
  resolvedTime?: Date | null;
  createdAt: Date;
};

const reportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    violatorId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    violatorType: {
      type: String,
      enum: ['user', 'track'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
    },
    resolvedTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

const Report = model<IReport>('Report', reportSchema);
export default Report;
