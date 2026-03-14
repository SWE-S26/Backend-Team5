import { Schema, model } from 'mongoose';

const searchHistoryItemSchema = new Schema(
  {
    type: { 
      type: String, 
      enum: ['Track', 'User', 'Playlist'], 
      required: true 
    },
    id: { 
      type: Schema.Types.ObjectId, 
      required: true, 
      refPath: 'type' 
    },
  },
  { _id: false }
);

const searchHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    historyList: {
      type: [searchHistoryItemSchema],
      default: []
    },
  },
  { timestamps: false }
);

export default model('SearchHistory', searchHistorySchema);