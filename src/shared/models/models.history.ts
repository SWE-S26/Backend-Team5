import { Schema, model } from 'mongoose';

const recentlyPlayedSchema = new Schema(
  {
    playlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Playlist',
      required: true
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
  },
  { _id: false }
);

const historyTrackSchema = new Schema(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
  },
  { _id: false }
);

const historySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    recentlyPlayed: {
      type: [recentlyPlayedSchema],
      default: []
    },
    historyTracks: {
      type: [historyTrackSchema],
      default: []
    },
  },
  { timestamps: false }
);

export default model('History', historySchema);