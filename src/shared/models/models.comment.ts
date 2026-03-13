import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500
    },
    numLikes: {
      type: Number,
      default: 0,
      min: 0
    },
    replyList: [{
      type: Schema.Types.ObjectId, 
      ref: 'Comment' 
    }],
    timestampSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    likedList: [{
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: true }
);

export default model('Comment', commentSchema);