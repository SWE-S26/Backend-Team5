import { Schema, Types, model } from 'mongoose';
import { imgSchema } from './schemas.shared';
import User from './models.user';
import logger from '../logger/logger';
import SearchHistory from './models.search-history';
import Notification from './models.notification';

export type IPlaylist = {
  _id: Types.ObjectId;
  artistId: Types.ObjectId;
  title: string;
  image: {
    url: string;
    publicId: string;
  };
  listOfTracks: [Types.ObjectId];
  releaseDate: Date;
  type: 'public' | 'private';
  numOfLikes: number;
  numOfReposts: number;
  playlistType: string;
  likedUser: [Types.ObjectId];
  createdAt: Date;
  updatedAt: Date;
};

const playlistSchema = new Schema(
  {
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
    },
    image: {
      type: imgSchema,
      default: () => ({}),
    },
    listOfTracks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    releaseDate: {
      type: Date,
      min: new Date('1950-01-01'),
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    numOfLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    numOfReposts: {
      type: Number,
      default: 0,
      min: 0,
    },
    playlistType: {
      type: String,
      default: '',
    },
    likedUser: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

async function cascadeDeletePlaylist(doc: IPlaylist): Promise<void> {
  try {
    await Promise.all([
      User.updateMany(
        { $or: [{ likedPlaylists: doc._id }, { playlists: doc._id }] },
        { $pull: { likedPlaylists: doc._id, playlists: doc._id } },
      ),

      // Remove playlist from user reposts (reposts.id is stored as string)
      User.updateMany(
        { 'reposts.id': doc._id.toString(), 'reposts.type': 'playlist' },
        { $pull: { reposts: { id: doc._id.toString(), type: 'playlist' } } },
      ),

      // Remove playlist from search histories
      SearchHistory.updateMany(
        { historyList: { $elemMatch: { type: 'Playlist', id: doc._id } } },
        { $pull: { historyList: { type: 'Playlist', id: doc._id } } },
      ),

      // Delete notifications that reference this playlist
      Notification.deleteMany({ 'type.referenceId': doc._id }),
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

// Capture docs in the pre-hook (before they are removed from the DB)
// so the post-hook can still iterate over them.
playlistSchema.pre('deleteMany', async function () {
  (this as any)._deletedDocs = await this.model.find(this.getFilter()).lean();
});

playlistSchema.post('deleteMany', async function () {
  const docs: IPlaylist[] = (this as any)._deletedDocs ?? [];
  if (docs.length === 0) return;
  await Promise.all(docs.map(cascadeDeletePlaylist));
});

const Playlist = model<IPlaylist>('Playlist', playlistSchema);
export default Playlist;
