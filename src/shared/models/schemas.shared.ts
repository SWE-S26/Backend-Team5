import { Schema } from 'mongoose';

export const imgSchema = new Schema(
  {
    img_link: { 
      type: String, 
      required: true 
    },
    public_id: { 
      type: String, 
      required: true 
    },
  },
  { _id: false }
);