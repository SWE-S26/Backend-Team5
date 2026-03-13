import { Schema, model } from 'mongoose';

const audioClipSchema = new Schema(
  {
    start: { 
      type: Number, 
      required: true 
    },
    end: { 
      type: Number, 
      required: true 
    },
  },
  { _id: false }
);

const advancedAudioDetailsSchema = new Schema(
  {
    track_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'Track', 
      required: true, 
      unique: true 
    },
    buy_link: { 
      type: String, 
      default: '' 
    },
    record_label: { 
      type: String, 
      default: '' 
    },
    release_date: { 
      type: Date 
    },
    publisher: { 
      type: String, 
      default: '' 
    },
    isrc: { 
      type: String, 
      default: '' 
    },
    explicit_content: { 
      type: Boolean, 
      default: false 
    },
    p_line: { 
      type: String, 
      default: '' 
    },
    licensing: {
      type: String,
      enum: ['All Rights Reserved', 'Creative Commons'],
      default: 'All Rights Reserved',
    },
    audio_clip: { 
      type: audioClipSchema 
    },
  },
  { timestamps: false }
);

export default model('AdvancedAudioDetails', advancedAudioDetailsSchema);