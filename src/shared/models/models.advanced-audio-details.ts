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
  albumTitle?: string;
};

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
