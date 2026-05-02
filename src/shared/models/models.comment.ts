import { Schema, Types, model } from 'mongoose';
import logger from '../logger/logger';
import Notification from './models.notification';
import Track from './models.track';

export type IComment = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  trackId: Types.ObjectId;
  mentionedUserId?: Types.ObjectId;
  content: string;
  numLikes: number;
  replyList: Types.ObjectId[];
  timestampSeconds: number;
  likedList: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    mentionedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500,
    },
    numLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    replyList: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    timestampSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedList: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

commentSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function (doc) {
    try {
      const replies = await Comment.find({ _id: { $in: doc.replyList } });

      await Promise.all([
        // Remove this comment from its parent track's comments array
        Track.updateOne({ _id: doc.trackId }, { $pull: { comments: doc._id } }),

        // Remove this comment from its parent comment's replyList
        Comment.updateOne(
          { replyList: doc._id },
          { $pull: { replyList: doc._id } },
        ),

        // Cascade-delete each reply (each fires this same hook recursively)
        ...replies.map((reply) => reply.deleteOne()),

        // Delete notifications that reference this comment
        Notification.deleteMany({ 'type.referenceId': doc._id }),
      ]);

      logger.debug(`Cascade deleted comment ${doc._id}`);
    } catch (error) {
      logger.error(`Error cascading delete for comment ${doc._id}: ${error}`);
    }
  },
);

const Comment = model<IComment>('Comment', commentSchema);
export default Comment;
