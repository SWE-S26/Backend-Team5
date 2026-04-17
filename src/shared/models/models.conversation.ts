import { Schema, Types, model } from 'mongoose';

export type IConversation = {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  archivedBy: Types.ObjectId[];
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
    archivedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    lastMessage: {
      type: lastMessageSchema,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;
