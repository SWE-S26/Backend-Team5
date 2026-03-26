import { Schema, Types, model, Document } from 'mongoose';
import logger from '../logger/logger';
import { imgSchema } from './schemas.shared';
import Settings from './models.settings';
import Notification from './models.notification';
import Playlist from './models.playlist';
import Following from './models.following';
import History from './models.history';
import Track from './models.track';
import BlockedList from './models.blocked-list';
import Comment from './models.comment';
import SearchHistory from './models.search-history';
import PlaysTrackHandling from './models.plays-track-handling';
import Message from './models.message';
import Report from './models.report';

export type IUser = {
  _id: Types.ObjectId;
  email: string;
  password: string;
  googleId?: string;
  role: 'Listener' | 'Admin';
  displayName: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  bio: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
  isVerified: boolean;
  profileImg: {
    imgLink: string;
    publicId: string;
  };
  bannerImg: {
    imgLink: string;
    publicId: string;
  };
  socialMediaLinks: [
    {
      name: string;
      link: string;
    },
  ];
  tracks: [Types.ObjectId];
  profileLink: string;
  links: [
    {
      name: string;
      link: string;
    },
  ];
  supportLink: string;
  likedPlaylists: [Types.ObjectId];
  likedTracks: [Types.ObjectId];
  playlists: [Types.ObjectId];
  uploads: [Types.ObjectId];
  reposts: [
    {
      id: string;
      caption: string;
      type: 'track' | 'playlist';
      timestamp: Date;
    },
  ];
  isPaid: boolean;
  isPrivate: boolean;
  ban: boolean;
  banReason: string;
  subscription: {
    subscriptionType: string;
    quota: {
      unlimited: boolean;
      usedSeconds: number;
      leftSeconds: number;
    };
  };
};

const socialLinkSchema = new Schema(
  {
    name: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
  },
);

const repostSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['track', 'playlist'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const quotaSchema = new Schema(
  {
    unlimited: {
      type: Boolean,
      default: false,
    },
    usedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    leftSeconds: {
      type: Number,
      default: 120,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['Listener', 'Artist', 'Pro', 'Admin'],
      required: true,
      default: 'Listener',
    },
    displayName: {
      type: String,
      default: '',
      required: true,
      minlength: 1,
      maxlength: 50,
    },
    firstName: {
      type: String,
      default: '',
      maxlength: 50,
    },
    lastName: {
      type: String,
      default: '',
      maxlength: 50,
    },
    city: {
      type: String,
      default: '',
      maxlength: 50,
    },
    country: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      min: new Date('1950-01-01'),
      validate: {
        validator: (v: Date) => {
          const d = new Date();
          d.setFullYear(d.getFullYear() - 13);
          return v <= d;
        },
        message: 'Must be at least 13 years old',
      },
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileImg: {
      type: imgSchema,
      default: () => ({
        imgLink:
          'https://res.cloudinary.com/dexluedse/image/upload/v1744719629/mobile-app/lwvswk21xn3wpgoufqxi.jpg',
        publicId: 'mobile-app/lwvswk21xn3wpgoufqxi',
      }),
    },
    bannerImg: {
      type: imgSchema,
      default: () => ({
        imgLink:
          'https://res.cloudinary.com/dexluedse/image/upload/v1744719629/mobile-app/lwvswk21xn3wpgoufqxi.jpg',
        publicId: 'mobile-app/lwvswk21xn3wpgoufqxi',
      }),
    },
    socialMediaLinks: {
      type: [socialLinkSchema],
      default: [],
    },
    tracks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    profileLink: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    links: {
      type: [socialLinkSchema],
      default: [],
    },
    supportLink: {
      type: String,
      default: '',
    },
    likedPlaylists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Playlist',
      },
    ],
    likedTracks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    playlists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Playlist',
      },
    ],
    uploads: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    reposts: {
      type: [repostSchema],
      default: [],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    ban: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: '',
      maxlength: 500,
    },
    subscription: {
      subscriptionType: {
        type: String,
        default: 'free',
      },
      quota: {
        type: quotaSchema,
        default: () => ({}),
      },
    },
  },
  { timestamps: true },
);

userSchema.post('save', async function (doc) {
  try {
    const existingSettings = await Settings.findOne({ userId: doc._id });
    if (!existingSettings) {
      await Settings.create({
        userId: doc._id,
        account: { dateOfBirth: doc.dateOfBirth, gender: doc.gender },
        content: { rssFeedLink: 'https://example.com/rss' },
      });
      logger.debug(`Settings created for user ${doc._id}`);
    }
  } catch (err: Error | any) {
    logger.error(
      `Failed to create settings for user ${doc._id}: ${err.message}`,
    );
  }
});

function sanitizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface IUserDoc extends IUser, Document {}

userSchema.pre<IUserDoc>('save', async function () {
  if (!this.isNew) return;

  const namePart = sanitizeName(this.displayName || 'user');
  const idPart = this._id.toString().slice(-4);
  const timePart = Date.now().toString().slice(-5);

  this.profileLink = `${namePart}-${idPart}${timePart}`;
});

userSchema.post('findOneAndDelete', async function (doc: IUser | null) {
  if (!doc) return;

  try {
    // ── Classify reposts by type up front ──────────────────────────────────
    const trackReposts = doc.reposts
      .filter((r) => r.type === 'track')
      .map((r) => new Types.ObjectId(r.id));

    const playlistReposts = doc.reposts
      .filter((r) => r.type === 'playlist')
      .map((r) => new Types.ObjectId(r.id));

    // ── Fetch docs that require document-level cascade ──────────────────────
    // (document-level deleteOne / findOneAndDelete triggers their own hooks)
    const [userTracks, userPlaylists, userComments, followingDoc] =
      await Promise.all([
        Track.find({ posterId: doc._id }),
        Playlist.find({ artistId: doc._id }),
        Comment.find({ userId: doc._id }),
        Following.findOne({ userId: doc._id }),
      ]);

    // Track cascade will already delete comments on the user's own tracks.
    // Only cascade-delete comments the user left on *other* users' tracks
    // to avoid redundant work and double-firing hooks.
    const ownTrackIds = new Set(userTracks.map((t) => t._id.toString()));
    const commentsOnExternalTracks = userComments.filter(
      (c) => !ownTrackIds.has(c.trackId.toString()),
    );

    // Tracks the user liked that are NOT their own (own tracks are being deleted)
    const externalLikedTracks = doc.likedTracks.filter(
      (id) => !ownTrackIds.has(id.toString()),
    );

    // Track reposts that reference tracks the user doesn't own
    const externalTrackReposts = trackReposts.filter(
      (id) => !ownTrackIds.has(id.toString()),
    );

    await Promise.all([
      // ── Owned records ─────────────────────────────────────────────────────
      Settings.findOneAndDelete({ userId: doc._id }),
      History.findOneAndDelete({ userId: doc._id }),
      SearchHistory.findOneAndDelete({ userId: doc._id }),
      PlaysTrackHandling.deleteMany({ userId: doc._id }),

      // ── Remove user from other users' search histories ────────────────────
      SearchHistory.updateMany(
        { historyList: { $elemMatch: { type: 'User', id: doc._id } } },
        { $pull: { historyList: { type: 'User', id: doc._id } } },
      ),

      // ── Messages ──────────────────────────────────────────────────────────
      Message.deleteMany({
        $or: [{ senderId: doc._id }, { receiverId: doc._id }],
      }),

      // ── Following: use document deleteOne so its cascade hook fires ───────
      followingDoc ? followingDoc.deleteOne() : Promise.resolve(),

      // ── Blocked lists ─────────────────────────────────────────────────────
      BlockedList.findOneAndDelete({ blockerId: doc._id }),
      BlockedList.updateMany(
        { blockedIds: doc._id },
        { $pull: { blockedIds: doc._id } },
      ),

      // ── Remove user from other comments' liked lists ──────────────────────
      Comment.updateMany(
        { likedList: doc._id },
        { $pull: { likedList: doc._id }, $inc: { numLikes: -1 } },
      ),

      // ── Cascade-delete user's tracks (each fires track's deleteOne hook) ──
      ...userTracks.map((track) => track.deleteOne()),

      // ── Cascade-delete user's playlists (fires playlist's cascade) ────────
      ...userPlaylists.map((playlist) =>
        Playlist.findOneAndDelete({ _id: playlist._id }),
      ),

      // ── Cascade-delete comments on external tracks ────────────────────────
      ...commentsOnExternalTracks.map((comment) => comment.deleteOne()),

      // ── Fix like counts on external tracks this user had liked ────────────
      ...externalLikedTracks.map((trackId) =>
        Track.updateOne(
          { _id: trackId },
          { $pull: { likedBy: doc._id }, $inc: { numOfLikes: -1 } },
        ),
      ),

      // ── Fix repost counts on external tracks this user had reposted ───────
      ...externalTrackReposts.map((trackId) =>
        Track.updateOne({ _id: trackId }, { $inc: { numberOfReposts: -1 } }),
      ),

      // ── Fix like counts on playlists this user had liked ──────────────────
      ...doc.likedPlaylists.map((playlistId) =>
        Playlist.updateOne(
          { _id: playlistId },
          { $pull: { likedUser: doc._id }, $inc: { numOfLikes: -1 } },
        ),
      ),

      // ── Fix repost counts on playlists this user had reposted ─────────────
      ...playlistReposts.map((playlistId) =>
        Playlist.updateOne({ _id: playlistId }, { $inc: { numOfReposts: -1 } }),
      ),

      // ── Reports: remove reports filed by or against the user ──────────────
      Report.deleteMany({
        $or: [
          { reporterId: doc._id },
          { reportedId: doc._id, violatorType: 'User' },
        ],
      }),

      // ── Notifications: remove notifications sent to or triggered by user ──
      Notification.deleteMany({
        $or: [{ to: doc._id }, { 'type.referenceId': doc._id }],
      }),
    ]);

    logger.debug(`Cascade deleted user ${doc._id}`);
  } catch (err: Error | any) {
    logger.error(`Failed to cascade delete user ${doc._id}: ${err.message}`);
  }
});

const User = model<IUser>('User', userSchema);
export default User;
