import { Schema } from 'mongoose';
import { number } from 'zod';

export const imgSchema = new Schema(
  {
    imgLink: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

export const audioSchema = new Schema(
  {
    audioLink: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    cloudIndex: {
      type: number,
      required: true,
    },
    downloadLink: {
      type: String,
      required: true,
    },
    waveformLink: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);
