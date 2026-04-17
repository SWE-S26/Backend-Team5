import { Schema, Types, model } from 'mongoose';

export type IConversation = {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  archivedBy: Types.ObjectId[];
  lastMessage: {
    _id: Types.ObjectId;
    content: string;
    senderId: Types.ObjectId;
    timestamp: Date;
    seenBy: Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
};

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
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;
