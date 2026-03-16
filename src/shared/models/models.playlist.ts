import { Schema, Types, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

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

const Playlist = model<IPlaylist>('Playlist', playlistSchema);
export default Playlist;
