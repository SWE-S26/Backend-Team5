import { Schema, model } from 'mongoose';

const playsSchema = new Schema(
  {
    trackId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Track', 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    numberOfPlay: { 
      type: Number, 
      default: 0 
    },
  },
  { timestamps: false }
);

export default model('Plays', playsSchema);