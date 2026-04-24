import { Schema, Types, model } from 'mongoose';

export type IMessage = {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  createdAt: Date;
  seenBy: Types.ObjectId[];
};

const messageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
      trim: true,
    },
    seenBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      require: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

const Message = model<IMessage>('Message', messageSchema);
export default Message;
