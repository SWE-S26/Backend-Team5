import { Schema, Types, model } from 'mongoose';

export type IFollowing = {
  userId: Types.ObjectId;
  followed: Types.ObjectId[];
  followers: Types.ObjectId[];
};

const followingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    followed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: false },
);

const Following = model<IFollowing>('Following', followingSchema);
export default Following;
