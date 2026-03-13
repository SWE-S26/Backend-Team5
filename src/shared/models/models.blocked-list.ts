import { Schema, model } from 'mongoose';

const blockedListSchema = new Schema(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    blockedIds: [{
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: false }
);

export default model('BlockedList', blockedListSchema);