import { Schema, model } from 'mongoose';

const recentlyPlayedSchema = new Schema(
  {
    playlist_id: { 
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
    track_id: { 
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
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    recently_played: { 
      type: [recentlyPlayedSchema], 
      default: [] 
    },
    history_tracks: { 
      type: [historyTrackSchema], 
      default: [] 
    },
  },
  { timestamps: false }
);

export default model('History', historySchema);