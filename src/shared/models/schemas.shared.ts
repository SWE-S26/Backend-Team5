import { Schema } from 'mongoose';

export const imgSchema = new Schema(
  {
    imgLink: {
      type: String,
      required: true,
      default:
        'https://res.cloudinary.com/dexluedse/image/upload/v1744719629/mobile-app/lwvswk21xn3wpgoufqxi.jpg',
    },
    publicId: {
      type: String,
      required: true,
      default: 'mobile-app/lwvswk21xn3wpgoufqxi',
    },
  },
  { _id: false },
);
