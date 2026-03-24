import { Schema } from 'mongoose';

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
