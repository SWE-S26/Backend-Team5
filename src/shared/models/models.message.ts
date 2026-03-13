import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
  {
    chat_id: { 
      type: String, 
      required: true, 
      index: true 
    },
    sender_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    receiver_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default model('Message', messageSchema);