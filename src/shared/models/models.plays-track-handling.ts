import { Schema, Types, model } from 'mongoose';

export type IPlaysTrackHandling = {
  trackId: Types.ObjectId;
  userId: Types.ObjectId;
  totalNumberOfPlay: number;
  isFanOfArtist: boolean;
  firstWeekNumPlays: number;
  trackCreatedAt: Date;
  playThroughPercentage: number;
};

const playsTrackHandlingSchema = new Schema(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalNumberOfPlay: {
      type: Number,
      default: 0,
    },
    isFanOfArtist: {
      type: Boolean,
      default: false,
    },
    firstWeekNumPlays: {
      type: Number,
      default: 0,
    },
    trackCreatedAt: {
      type: Date,
      required: true,
    },
    playThroughPercentage: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: false },
);

const PlaysTrackHandling = model<IPlaysTrackHandling>(
  'PlaysTrackHandling',
  playsTrackHandlingSchema,
);
export default PlaysTrackHandling;
