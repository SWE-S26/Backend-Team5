import { Schema, model } from 'mongoose';

const followingSchema = new Schema(
  {
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    followed: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    followers: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: false }
);

export default model('Following', followingSchema);