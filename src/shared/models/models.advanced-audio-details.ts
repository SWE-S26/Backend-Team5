import { Schema, model } from 'mongoose';

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
  },
  { timestamps: false },
);

export default model('AdvancedAudioDetails', advancedAudioDetailsSchema);
