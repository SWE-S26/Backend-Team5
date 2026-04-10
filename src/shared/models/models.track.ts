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
  };
  posterId: Types.ObjectId;
  image: {
    url: string;
    publicId: string;
  };
  numOfPlays: number;
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
  composer: string;
  releaseTitle: string;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

trackSchema.pre<ITrack>(
  'deleteOne',
  { document: true, query: false },
  async function () {
    const trackToDelete = this;

    // Get all comments of the track
    const comments = await Comment.find({ trackId: trackToDelete._id }).select(
      '_id replyList',
    );
    const commentIds = comments.map((c) => c._id);
    const replyIds = comments.flatMap((c) => c.replyList);

    await Promise.all([
      AdvancedAudioDetails.deleteOne({ trackId: trackToDelete._id }),
      Comment.deleteMany({ _id: { $in: [...commentIds, ...replyIds] } }),
      User.updateMany(
        { likedTracks: trackToDelete._id },
        { $pull: { likedTracks: trackToDelete._id } },
      ),
      User.deleteMany(
        { reposts: { $elemMatch: { id: trackToDelete._id, type: 'track' } } },
        { $pull: { reposts: { id: trackToDelete._id, type: 'track' } } },
      ),
      History.updateMany(
        { 'historyTracks.trackId': trackToDelete._id },
        { $pull: { historyTracks: { trackId: trackToDelete._id } } },
      ),
      Playlist.updateMany(
        { listOfTracks: trackToDelete._id },
        { $pull: { listOfTracks: trackToDelete._id } },
      ),
      Plays.deleteMany({ trackId: trackToDelete._id }),
      PlaysTrackHandling.deleteOne({ trackId: trackToDelete._id }),
    ]);
  },
);

const Track = model<ITrack>('Track', trackSchema);

trackSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function (doc) {
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

      // Fetch comment documents so each triggers its own cascade via deleteOne
      const comments = await Comment.find({ trackId: doc._id });

      await Promise.all([
        // Remove audio analysis record
        AdvancedAudioDetails.deleteOne({ trackId: doc._id }),

        // Cascade-delete every comment on this track (each fires comment hook)
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

        // Remove track from user reposts (reposts.id is stored as string)
        User.updateMany(
          { 'reposts.id': doc._id.toString(), 'reposts.type': 'track' },
          { $pull: { reposts: { id: doc._id.toString(), type: 'track' } } },
        ),

        // Remove track from any playlist that contains it
        Playlist.updateMany(
          { listOfTracks: doc._id },
          { $pull: { listOfTracks: doc._id } },
        ),

        // Delete all play-count records for this track
        Plays.deleteMany({ trackId: doc._id }),
        PlaysTrackHandling.deleteMany({ trackId: doc._id }),

        // Delete admin reports filed against this track
        Report.deleteMany({ reportedId: doc._id, violatorType: 'Track' }),

        // Delete notifications that reference this track
        Notification.deleteMany({ 'type.referenceId': doc._id }),

        // Remove track from search histories
        SearchHistory.updateMany(
          { historyList: { $elemMatch: { type: 'Track', id: doc._id } } },
          { $pull: { historyList: { type: 'Track', id: doc._id } } },
        ),
      ]);

      logger.debug(`Cascade deleted track ${doc._id}`);
    } catch (error) {
      logger.error(`Error cascading delete for track ${doc._id}: ${error}`);
    }
  },
);

export default Track;
