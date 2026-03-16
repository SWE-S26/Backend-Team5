import { Schema, Types, model } from 'mongoose';

export type IComment = {
  userId: Types.ObjectId;
  trackId: Types.ObjectId;
  content: string;
  numLikes: number;
  replyList: Types.ObjectId[];
  timestampSeconds: number;
  likedList: Types.ObjectId[];
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

const Comment = model<IComment>('Comment', commentSchema);
export default Comment;
