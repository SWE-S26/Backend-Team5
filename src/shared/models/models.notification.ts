import { Schema, model } from 'mongoose';

const notificationTypeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'repost', 'mention', 'newMessage', 'newTrack'],
      required: true,
    },
    referenceId: { 
      type: Schema.Types.ObjectId, 
      required: true 
    },
  },
  { _id: false }
);

const notificationSchema = new Schema(
  {
    to: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    type: { 
      type: notificationTypeSchema, 
      required: true 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default model('Notification', notificationSchema);