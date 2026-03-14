import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default model('Message', messageSchema);