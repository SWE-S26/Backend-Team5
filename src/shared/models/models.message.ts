import { Schema, Types, model } from 'mongoose';

export type IMessage = {
  chatId: string;
  senderId: Types.ObjectId;
  content: string;
  createdAt: Date;
};

const messageSchema = new Schema(
  {
    chatId: {
      type: String,
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
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

const Message = model<IMessage>('Message', messageSchema);
export default Message;
