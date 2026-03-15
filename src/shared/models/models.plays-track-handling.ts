import { Schema, model } from 'mongoose';

const playsTrackHandlingSchema = new Schema(
  {
    trackId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Track', 
      required: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    totalNumberOfPlay: { 
      type: Number, 
      default: 0 
    },
    isFanOfArtist: { 
      type: Boolean, 
      default: false 
    },
    firstWeekNumPlays: { 
      type: Number, 
      default: 0 
    },
    trackCreatedAt: { 
      type: Date, 
      required: true 
    },
    playThroughPercentage: { 
      type: Number, 
      default: 0.0, 
      min: 0, 
      max: 100 
    },
  },
  { timestamps: false }
);

export default model('PlaysTrackHandling', playsTrackHandlingSchema);