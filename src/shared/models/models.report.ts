import { Schema, model } from 'mongoose';

const reportSchema = new Schema(
  {
    reporter_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    reported_id: { 
      type: Schema.Types.ObjectId, 
      required: true 
    },
    complaint_type: {
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
    violator_type: { 
      type: String, 
      enum: ['User', 'Comment', 'Track'], 
      required: true 
    },
    content: { 
      type: String, 
      default: '' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'resolved', 'dismissed'], 
      default: 'pending' 
    },
    admin_note: { 
      type: String, 
      default: '' 
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default model('Report', reportSchema);