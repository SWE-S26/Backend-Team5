import { Schema, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

const permissionsSchema = new Schema(
  {
    enableDirectDownload: { 
      type: Boolean, 
      default: false 
    },
    offlineListening: { 
      type: Boolean, 
      default: false 
    },
    includeInRssFeed: { 
      type: Boolean, 
      default: false 
    },
    displayedEmbedCode: { 
      type: Boolean, 
      default: false 
    },
    enableAppPlayback: { 
      type: Boolean, 
      default: true 
    },
  },
  { _id: false }
);

const licenseSchema = new Schema(
  {
    type: { 
      type: String, 
      enum: ['allRightsReserved', 'creativeCommons'], 
      default: 'allRightsReserved' 
    },
    attribution: { 
      type: Boolean, 
      default: false 
    },
    nonCommercial: { 
      type: Boolean, 
      default: false 
    },
    noDerivativeWorks: { 
      type: Boolean, 
      default: false 
    },
    shareAlike: { 
      type: Boolean, 
      default: false 
    },
  },
  { _id: false }
);

const trackSchema = new Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    audio_url: { 
      type: String, 
      required: true 
    },
    main_artist: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    genre: { 
      type: String, 
      default: '' 
    },
    tags: { 
      type: [String], 
      default: [] 
    },
    description: { 
      type: String, 
      default: '' 
    },
    privacy: { 
      type: String, 
      enum: ['Public', 'Private', 'Schedule'], 
      default: 'Public' 
    },
    image: { 
      type: imgSchema, 
      default: () => ({}) 
    },
    num_of_plays: { 
      type: Number, 
      default: 0 
    },
    comments: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Comment' 
    }],
    number_of_reposts: { 
      type: Number, 
      default: 0 
    },
    num_of_likes: { 
      type: Number, 
      default: 0 
    },
    liked_by: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    permissions: { 
      type: permissionsSchema, 
      default: () => ({}) 
    },
    license: { 
      type: licenseSchema, 
      default: () => ({}) 
    },
    composer: { 
      type: String, 
      default: '' 
    },
    release_title: { 
      type: String, 
      default: '' 
    },
    caption: { 
      type: String, 
      default: '' 
    },
    hidden: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

export default model('Track', trackSchema);