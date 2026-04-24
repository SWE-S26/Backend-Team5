import { Model, Schema, Types, model } from 'mongoose';
import { imgSchema } from './schemas.shared';
import User from './models.user';
import logger from '../logger/logger';
import SearchHistory from './models.search-history';
import Notification from './models.notification';
import { CloudinaryService } from '../abstractions/cloudinary.service';
import {
  redisRepoCacher,
  RedisObjectType,
} from '../abstractions/redis/redisRepoCacher';
import { DEFAULT_PLAYLIST_IMAGE } from '../../config/constants';
import { boolean } from 'zod';

export type IPlaylist = {
  _id: Types.ObjectId;
  artistId: Types.ObjectId;
  title: string;
  permaLink: string;
  image: { url: string; publicId: string };
  description: string;
  genre: string;
  listOfTracks: Types.ObjectId[];
  additionalTags: string[];
  releaseDate: Date;
  isPrivate: boolean;
  numOfLikes: number;
  numOfReposts: number;
  playlistType: 'playlist' | 'album' | 'compilation' | 'single';
  playlistLengthInSeconds: number;
  likedUser: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  rssFeedLink?: string;
  recordLabel?: string;
};

interface IPlaylistModel extends Model<IPlaylist> {
  findByIdCached(id: string): Promise<IPlaylist | null>;
}

const MAX_TRACKS = 150;

const playlistSchema = new Schema<IPlaylist, IPlaylistModel>(
  {
    artistId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, minlength: 1, maxlength: 100 },
    permaLink: { type: String, required: true, minlength: 1, maxlength: 100 },
    image: {
      type: imgSchema,
      default: () => ({
        imgLink: DEFAULT_PLAYLIST_IMAGE.imgLink,
        publicId: DEFAULT_PLAYLIST_IMAGE.publicId,
      }),
    },
    description: { type: String, maxlength: 500, default: '' },
    genre: { type: String, maxlength: 50, default: 'None' },
    listOfTracks: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Track' }],
      validate: [
        {
          validator: (v: Types.ObjectId[]) => v.length <= MAX_TRACKS,
          message: `A playlist cannot exceed ${MAX_TRACKS} tracks`,
        },
      ],
    },
    additionalTags: { type: [{ type: String, maxlength: 30 }], default: [] },
    releaseDate: { type: Date, min: new Date('1950-01-01') },
    isPrivate: { type: Boolean, default: false },
    numOfLikes: { type: Number, default: 0, min: 0 },
    numOfReposts: { type: Number, default: 0, min: 0 },
    playlistType: {
      type: String,
      enum: ['playlist', 'album', 'compilation', 'single'],
      default: 'playlist',
    },
    playlistLengthInSeconds: { type: Number, default: 0, min: 0 },
    likedUser: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    rssFeedLink: { type: String, default: '' },
    recordLabel: { type: String, maxlength: 100, default: '' },
  },
  { timestamps: true },
);

async function invalidatePlaylistCache(id: Types.ObjectId): Promise<void> {
  await redisRepoCacher.invalidateCache(
    RedisObjectType.PLAYLIST,
    id.toString(),
  );
}

/**
 * Always returns a plain object (lean), never a Mongoose document.
 * Use this everywhere instead of `findById(...).lean()`.
 *
 * Since the cache only ever stores lean POJOs, both paths (cache hit and DB hit)
 * return the same shape — callers never need to call `.lean()` themselves.
 *
 * DO NOT use this for queries that require `.populate()`.
 * Populated and unpopulated shapes must never share the same cache key.
 */
playlistSchema.statics.findByIdCached = async function (
  this: IPlaylistModel,
  id: string,
): Promise<IPlaylist | null> {
  const cached = await redisRepoCacher.getCachedObject<IPlaylist>(
    RedisObjectType.PLAYLIST,
    id,
  );
  if (cached) return cached;

  const result = await this.findById(id).lean<IPlaylist>().exec();
  if (result) {
    await redisRepoCacher.cacheObject(RedisObjectType.PLAYLIST, id, result);
  }
  return result ?? null;
};

/**
 * Only fires on full document saves (new doc or doc.save()).
 * findOneAndUpdate intentionally does NOT warm the cache here —
 * partial updates mean we can't guarantee the full object shape,
 * so we invalidate instead (see below).
 */
playlistSchema.post('save', async function (doc) {
  await User.updateOne(
    { _id: doc.artistId },
    { $push: { playlists: doc._id } },
  );

  await redisRepoCacher.cacheObject(
    RedisObjectType.PLAYLIST,
    doc._id.toString(),
    doc.toObject(),
  );
});

playlistSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;
  await invalidatePlaylistCache(doc._id);
});

async function cascadeDeletePlaylist(doc: IPlaylist): Promise<void> {
  try {
    if (
      doc.image.publicId &&
      doc.image.publicId !== DEFAULT_PLAYLIST_IMAGE.publicId
    ) {
      CloudinaryService.deleteImage(doc.image.publicId)
        .then(() =>
          logger.debug(
            `Deleted playlist image from Cloudinary for playlist ${doc._id}`,
          ),
        )
        .catch((error) =>
          logger.error(
            `Failed to delete playlist image from Cloudinary for playlist ${doc._id}: ${error}`,
          ),
        );
    }

    await Promise.all([
      User.updateMany(
        { $or: [{ likedPlaylists: doc._id }, { playlists: doc._id }] },
        { $pull: { likedPlaylists: doc._id, playlists: doc._id } },
      ),
      User.updateMany(
        { 'reposts.id': doc._id.toString(), 'reposts.type': 'playlist' },
        { $pull: { reposts: { id: doc._id.toString(), type: 'playlist' } } },
      ),
      SearchHistory.updateMany(
        { historyList: { $elemMatch: { type: 'Playlist', id: doc._id } } },
        { $pull: { historyList: { type: 'Playlist', id: doc._id } } },
      ),
      Notification.deleteMany({ 'type.referenceId': doc._id }),
      invalidatePlaylistCache(doc._id),
    ]);

    logger.debug(`Cascade deleted playlist ${doc._id}`);
  } catch (error) {
    logger.error(`Error cascading delete for playlist ${doc._id}: ${error}`);
  }
}

playlistSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  await cascadeDeletePlaylist(doc);
});

playlistSchema.pre('deleteMany', async function () {
  (this as any)._deletedDocs = await this.model.find(this.getFilter()).lean();
});

playlistSchema.post('deleteMany', async function () {
  const docs: IPlaylist[] = (this as any)._deletedDocs ?? [];
  if (docs.length === 0) return;
  await Promise.all(docs.map(cascadeDeletePlaylist));
});

playlistSchema.post('findOneAndReplace', async function (doc) {
  if (!doc) return;
  await invalidatePlaylistCache(doc._id);
});

playlistSchema.pre('updateOne', async function () {
  const doc = await this.model
    .findOne(this.getFilter())
    .select('_id')
    .lean<{ _id: Types.ObjectId }>();
  (this as any)._affectedId = doc?._id ?? null;
});

playlistSchema.post('updateOne', async function () {
  const id: Types.ObjectId | null = (this as any)._affectedId;
  if (!id) return;
  await invalidatePlaylistCache(id);
});

playlistSchema.post('updateMany', async function () {
  const ids: Types.ObjectId[] = (this as any)._affectedIds ?? [];
  if (ids.length === 0) return;
  await Promise.all(ids.map(invalidatePlaylistCache));
});

const Playlist = model<IPlaylist, IPlaylistModel>('Playlist', playlistSchema);

export default Playlist;
