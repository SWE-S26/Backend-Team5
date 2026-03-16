import { Schema, Types, model } from 'mongoose';

export type ISearchHistory = {
  userId: Types.ObjectId;
  historyList: {
    type: 'Track' | 'User' | 'Playlist';
    id: Schema.Types.ObjectId;
  }[];
};

const searchHistoryItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Track', 'User', 'Playlist'],
      required: true,
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'type',
    },
  },
  { _id: false },
);

const searchHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    historyList: {
      type: [searchHistoryItemSchema],
      default: [],
    },
  },
  { timestamps: false },
);

const SearchHistory = model<ISearchHistory>(
  'SearchHistory',
  searchHistorySchema,
);
export default SearchHistory;
