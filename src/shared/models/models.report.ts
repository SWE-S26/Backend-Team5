import { Schema, model } from 'mongoose';

const reportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    complaintType: {
      type: String,
      enum: [
        'Spam',
        'Impersonation',
        'Abuse',
        'Trademark infringement',
        'Audio track posted on wrong account',
        'Other',
      ],
      required: true,
    },
    violatorType: {
      type: String,
      enum: ['User', 'Comment', 'Track'],
      required: true
    },
    content: {
      type: String,
      default: '',
      maxlength: 2000
    },
    status: { 
      type: String, 
      enum: ['pending', 'resolved', 'dismissed'], 
      default: 'pending' 
    },
    adminNote: {
      type: String,
      default: '',
      maxlength: 2000
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default model('Report', reportSchema);