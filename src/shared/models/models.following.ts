import { Schema, Types, model } from 'mongoose';
import logger from '../logger/logger';

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

followingSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function (doc) {
    try {
      await Promise.all([
        // Remove this user from followers' followed lists
        Following.updateMany(
          { followed: doc.userId },
          { $pull: { followed: doc.userId } },
        ),
        // Remove this user from followed users' followers lists
        Following.updateMany(
          { followers: doc.userId },
          { $pull: { followers: doc.userId } },
        ),
      ]);

      logger.debug(`Cleaned up following relationships for user ${doc.userId}`);
    } catch (error) {
      logger.error(
        `Error cleaning up following relationships for user ${doc.userId}: ${error}`,
      );
    }
  },
);

const Following = model<IFollowing>('Following', followingSchema);
export default Following;
