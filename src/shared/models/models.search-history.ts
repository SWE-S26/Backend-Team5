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
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    history_list: { 
      type: [searchHistoryItemSchema], 
      default: [] 
    },
  },
  { timestamps: false }
);

export default model('SearchHistory', searchHistorySchema);