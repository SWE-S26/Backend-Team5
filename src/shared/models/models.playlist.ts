import { Schema, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

const playlistSchema = new Schema(
  {
    artist_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    image: { 
      type: imgSchema, 
      default: () => ({}) 
    },
    list_of_tracks: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Track' 
    }],
    release_date: { 
      type: Date 
    },
    type: { 
      type: String, 
      enum: ['public', 'private'], 
      default: 'public' 
    },
    num_of_likes: { 
      type: Number, 
      default: 0 
    },
    num_of_reposts: { 
      type: Number, 
      default: 0 
    },
    playlist_type: { 
      type: String, 
      default: '' 
    },
    liked_user: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: true }
);

export default model('Playlist', playlistSchema);