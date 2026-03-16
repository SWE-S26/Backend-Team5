import { Schema, Types, model } from 'mongoose';

export type INotification = {
  to: Types.ObjectId;
  type: {
    type:
      | 'follow'
      | 'like'
      | 'comment'
      | 'repost'
      | 'mention'
      | 'newMessage'
      | 'newTrack';
    referenceId: Types.ObjectId;
  };
  read: boolean;
  createdAt: Date;
};

const notificationTypeSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'follow',
        'like',
        'comment',
        'repost',
        'mention',
        'newMessage',
        'newTrack',
      ],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false },
);

const notificationSchema = new Schema(
  {
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: notificationTypeSchema,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

const Notification = model<INotification>('Notification', notificationSchema);
export default Notification;
