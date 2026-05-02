import { Types, Schema, model } from 'mongoose';
import { imgSchema, audioSchema } from './schemas.shared';
import { DEFAULT_AUDIO_IMAGE } from '../../config/constants';
import { CloudinaryService } from '../abstractions/cloudinary.service';
import logger from '../logger/logger';
import Report from './models.report';
import Notification from './models.notification';
import SearchHistory from './models.search-history';
import AdvancedAudioDetails, {
  IAdvancedAudioDetails,
} from './models.advanced-audio-details';
import Comment from './models.comment';
import User from './models.user';
import History from './models.history';
import Playlist from './models.playlist';
import Plays from './models.plays';
import PlaysTrackHandling from './models.plays-track-handling';
import blobStorageService from '../abstractions/blob.service';
import publitioMediaStorage from '../abstractions/publitio.service';
import { HydratedDocument } from 'mongoose';

export type ITrack = {
  _id: Types.ObjectId;
  basicInfo: {
    title: string;
    permalink: string;
    mainArtists: string[];
    genre: string;
    tags: string[];
    description: string;
    isPrivate: boolean;
    caption: string;
  };
  audio: {
    url: string;
    id: string;
    cloudIndex: number;
    downloadLink: string;
    waveformLink: string;
  };
  posterId: Types.ObjectId;
  image: {
    url: string;
    publicId: string;
  };
  durationInSeconds: number;
  numOfPlays: number;
  numOfDownloads: number;
  comments: Types.ObjectId[];
  numberOfReposts: number;
  numOfLikes: number;
  likedBy: Types.ObjectId[];
  permissions: {
    enableDirectDownload: boolean;
    offlineListening: boolean;
    includeInRssFeed: boolean;
    displayedEmbedCode: boolean;
    enableAppPlayback: boolean;
  };
  license: {
    type: 'allRightsReserved' | 'creativeCommons';
    attribution: boolean;
    nonCommercial: boolean;
    noDerivativeWorks: boolean;
    shareAlike: boolean;
  };
  geoBlocking: {
    mode: 'worldwide' | 'exclusive' | 'blocked';
    regions: string[];
    countries: string[];
  };
  composer: string;
  releaseTitle: string;
  hidden: boolean;
  banReason: string;
  createdAt: Date;
  audioClip?: {
    start: number;
    end: number;
  };
  updatedAt: Date;
  mobileProPreview: boolean;
};

export enum GeoblockingMode {
  WORLDWIDE = 'worldwide',
  EXCLUSIVE = 'exclusive',
  BLOCKED = 'blocked',
}

const audioClipSchema = new Schema(
  {
    start: {
      type: Number,
      required: true,
      min: 0,
    },
    end: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const geoBlockingSchema = new Schema(
  {
    mode: {
      type: String,
      enum: Object.values(GeoblockingMode),
      default: GeoblockingMode.WORLDWIDE,
      required: true,
    },
    regions: {
      type: [String],
      default: [],
    },
    countries: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

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
        type: String,
        default: '',
      },
      isPrivate: {
        type: Boolean,
        default: false,
      },
      caption: {
        type: String,
        default: '',
        maxlength: 500,
      },
    },
    audio: {
      type: audioSchema,
      required: true,
    },
    posterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: imgSchema,
      default: () => ({
        imgLink: DEFAULT_AUDIO_IMAGE.imgLink,
        publicId: DEFAULT_AUDIO_IMAGE.publicId,
      }),
    },
    durationInSeconds: {
      type: Number,
      required: true,
      min: [1, 'Duration Cannot Be Less Than One Second'],
    },
    numOfPlays: {
      type: Number,
      default: 0,
      min: 0,
    },
    numOfDownloads: {
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
    geoBlocking: {
      type: geoBlockingSchema,
      required: true,
      default: () => ({}),
    },
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
    hidden: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: '',
    },
    audioClip: {
      type: audioClipSchema,
    },
    mobileProPreview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

trackSchema.post(
  ['deleteOne', 'findOneAndDelete'],
  { document: true, query: false },
  async function (doc: HydratedDocument<ITrack>) {
    try {
      if (
        doc.image.publicId &&
        doc.image.publicId !== DEFAULT_AUDIO_IMAGE.publicId
      ) {
        CloudinaryService.deleteImage(doc.image.publicId)
          .then(() => {
            logger.debug(
              `Successfully deleted track image from Cloudinary for track ${doc._id}`,
            );
          })
          .catch((error) => {
            logger.error(
              `Failed to delete track image from Cloudinary for track ${doc._id}: ${error}`,
            );
          });
      }
      await Promise.all([
        publitioMediaStorage
          .deleteAudioTrack(doc.audio.id, doc.audio.cloudIndex)
          .then(() => {
            logger.debug(
              `Successfully deleted audio track from Publitio for user ${doc._id}`,
            );
          })
          .catch((error) => {
            logger.error(
              `Failed to delete audio track from Publitio for user ${doc._id}: ${error}`,
            );
          }),
        // Blob
        blobStorageService
          .deleteWaveFromBlob(doc._id)
          .then(() => {
            logger.debug(
              `Successfully deleted wave from blob for track ${doc._id}`,
            );
          })
          .catch((error) => {
            logger.error(
              `Failed to delete wave from blob for track ${doc._id}: ${error}`,
            );
          }),
      ]);

      const comments = await Comment.find({ trackId: doc._id });

      await Promise.all([
        // Remove audio analysis record
        AdvancedAudioDetails.deleteOne({ trackId: doc._id }),

        // Cascade-delete every comment (each fires comment hook)
        ...comments.map((comment) => comment.deleteOne()),

        // Remove track from all user array references
        User.updateMany(
          {
            $or: [
              { likedTracks: doc._id },
              { uploads: doc._id },
              { tracks: doc._id },
            ],
          },
          {
            $pull: {
              likedTracks: doc._id,
              uploads: doc._id,
              tracks: doc._id,
            },
          },
        ),

        // Remove track from user reposts
        User.updateMany(
          { 'reposts.id': doc._id.toString(), 'reposts.type': 'track' },
          { $pull: { reposts: { id: doc._id.toString(), type: 'track' } } },
        ),

        // Remove track from any playlist that contains it
        Playlist.updateMany(
          { listOfTracks: doc._id },
          { $pull: { listOfTracks: doc._id } },
        ),

        // Delete all play-count records
        Plays.deleteMany({ trackId: doc._id }),
        PlaysTrackHandling.deleteMany({ trackId: doc._id }),

        // Delete admin reports filed against this track
        Report.deleteMany({ violatorId: doc._id, violatorType: 'track' }),

        // Delete notifications that reference this track
        Notification.deleteMany({ 'type.referenceId': doc._id }),

        // Remove track from search histories
        SearchHistory.updateMany(
          { historyList: { $elemMatch: { type: 'Track', id: doc._id } } },
          { $pull: { historyList: { type: 'Track', id: doc._id } } },
        ),

        // Remove track from history records
        History.updateMany(
          { 'historyTracks.trackId': doc._id },
          { $pull: { historyTracks: { trackId: doc._id } } },
        ),
      ]);

      logger.debug(`Cascade deleted track ${doc._id}`);
    } catch (error) {
      logger.error(`Error cascading delete for track ${doc._id}: ${error}`);
    }
  },
);

const Track = model<ITrack>('Track', trackSchema);
export default Track;
