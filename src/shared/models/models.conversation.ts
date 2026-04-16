import { Schema, Types, model } from 'mongoose';

export type IConversation = {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  isArchived: boolean;
  isReported: boolean;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
};

const lastMessageSchema = new Schema(
  {
    content: {
      type: String,
      minlength: 1,
      maxlength: 2000,
      trim: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: function (v: Types.ObjectId[]) {
          return Array.isArray(v) && v.length === 2;
        },
        message: 'A chat must have exactly 2 participants',
      },
    },
    isArchived: {
      type: Boolean,
      required: true,
      default: false,
    },
    isReported: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastMessage: {
      type: lastMessageSchema,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;
