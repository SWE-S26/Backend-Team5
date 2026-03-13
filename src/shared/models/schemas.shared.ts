import { Schema } from 'mongoose';

export const imgSchema = new Schema(
  {
    img_link: { type: String, default: '' },
    public_id: { type: String, default: '' },
  },
  { _id: false }
);
