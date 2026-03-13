import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    track_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'Track', 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    num_likes: { 
      type: Number, 
      default: 0 
    },
    reply_list: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Comment' 
    }],
    timestamp_seconds: { 
      type: Number, 
      default: 0 
    },
    liked_list: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: true }
);

export default model('Comment', commentSchema);