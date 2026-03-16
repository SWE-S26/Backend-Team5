import { Schema, Types, model } from 'mongoose';

export type IHistory = {
  userId: Types.ObjectId;
  recentlyPlayed: {
    playlistId: Types.ObjectId;
    timestamp: Date;
  }[];
  historyTracks: {
    trackId: Types.ObjectId;
    timestamp: Date;
  }[];
};

const recentlyPlayedSchema = new Schema(
  {
    playlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Playlist',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const historyTrackSchema = new Schema(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    recentlyPlayed: {
      type: [recentlyPlayedSchema],
      default: [],
    },
    historyTracks: {
      type: [historyTrackSchema],
      default: [],
    },
  },
  { timestamps: false },
);

const History = model<IHistory>('History', historySchema);
export default History;
