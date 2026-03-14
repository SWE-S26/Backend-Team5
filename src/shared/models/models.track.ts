import { Schema, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

const permissionsSchema = new Schema(
  {
    enableDirectDownload: {
      type: Boolean,
      default: false,
    },
    offlineListening: {
      type: Boolean,
      default: false,
    },
    includeInRssFeed: {
      type: Boolean,
      default: false,
    },
    displayedEmbedCode: {
      type: Boolean,
      default: false,
    },
    enableAppPlayback: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const licenseSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['allRightsReserved', 'creativeCommons'],
      default: 'allRightsReserved',
    },
    attribution: {
      type: Boolean,
      default: false,
    },
    nonCommercial: {
      type: Boolean,
      default: false,
    },
    noDerivativeWorks: {
      type: Boolean,
      default: false,
    },
    shareAlike: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const trackSchema = new Schema(
  {
    basicInfo: {
      title: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100,
      },
      permalink: {
        type: String,
        default: '',
      },
      mainArtists: {
        type: [String],
        required: true,
      },
      genre: {
        type: String,
        default: '',
      },
      tags: {
        type: [String],
        default: [],
      },
      description: {
        type: [String],
        default: [],
      },
      isPrivate: {
        type: Boolean,
        default: false,
      },
    },
    audioUrl: {
      type: String,
      required: true,
    },
    posterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: imgSchema,
      default: () => ({}),
    },
    numOfPlays: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    numberOfReposts: {
      type: Number,
      default: 0,
      min: 0,
    },
    numOfLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
    license: {
      type: licenseSchema,
      default: () => ({}),
    },
    composer: {
      type: String,
      default: '',
    },
    releaseTitle: {
      type: String,
      default: '',
      maxlength: 100,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 500,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default model('Track', trackSchema);
