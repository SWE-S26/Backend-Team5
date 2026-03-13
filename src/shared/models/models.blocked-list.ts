import { Schema, model } from 'mongoose';

const blockedListSchema = new Schema(
  {
    blocker_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    blocked_ids: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: false }
);

export default model('BlockedList', blockedListSchema);