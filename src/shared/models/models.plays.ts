import { Schema, Types, model } from 'mongoose';

export type IPlays = {
  trackId: Types.ObjectId;
  date: Date;
  numberOfPlay: number;
};

const playsSchema = new Schema(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    numberOfPlay: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false },
);

const Plays = model<IPlays>('Plays', playsSchema);
export default Plays;
