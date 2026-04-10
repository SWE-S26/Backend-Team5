import { Schema, Types, model } from 'mongoose';

export type IAdvancedAudioDetails = {
  trackId: Types.ObjectId;
  buyLink?: string;
  recordLabel?: string;
  releaseDate?: Date;
  publisher?: string;
  isrc?: string;
  iswc?: string;
  explicitContent?: boolean;
  pLine?: string;
  audioClip?: {
    start: number;
    end: number;
  };
  albumTitle?: string;
};

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

const advancedAudioDetailsSchema = new Schema(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
      unique: true,
    },
    buyLink: {
      type: String,
      default: '',
    },
    recordLabel: {
      type: String,
      default: '',
      maxlength: 100,
    },
    releaseDate: {
      type: Date,
      min: new Date('1950-01-01'),
    },
    publisher: {
      type: String,
      default: '',
      maxlength: 100,
    },
    isrc: {
      type: String,
      default: '',
    },
    explicitContent: {
      type: Boolean,
      default: false,
    },
    pLine: {
      type: String,
      default: '',
    },
    audioClip: {
      type: audioClipSchema,
    },
    iswc: {
      type: String,
      default: '',
    },
    albumTitle: {
      type: String,
      default: '',
    },
  },
  { timestamps: false },
);

const AdvancedAudioDetails = model<IAdvancedAudioDetails>(
  'AdvancedAudioDetails',
  advancedAudioDetailsSchema,
);
export default AdvancedAudioDetails;
