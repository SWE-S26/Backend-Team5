import { Schema, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

const socialLinkSchema = new Schema(
  {
    link_id: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    link: { 
        type: String, 
        required: true 
    },
  },
  { 
    _id: false 
  }
);

const repostSchema = new Schema(
  {
    id: { 
        type: String, 
        required: true 
    },
    caption: { 
        type: String, 
        default: '' 
    },
    type: { 
        type: String, 
        enum: ['track', 'playlist'], 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
  },
  { 
    _id: false 
  }
);

const quotaSchema = new Schema(
  {
    unlimited: { 
        type: Boolean, 
        default: false 
    },
    used_seconds: { 
        type: Number, 
        default: 0 
    },
    left_seconds: { 
        type: Number, 
        default: 120 
    },
  },
  { 
    _id: false 
  }
);

const userSchema = new Schema(
  {
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['Listener/Artist', 'Admin'], 
        required: true, 
        default: 'Listener/Artist' 
    },
    display_name: { 
        type: String, 
        default: '', 
        required: true 
    },
    first_name: { 
        type: String, 
        default: '' 
    },
    last_name: { 
        type: String, 
        default: '' 
    },
    city: { 
        type: String, 
        default: '' 
    },
    country: { 
        type: String, 
        default: '' 
    },
    bio: { 
        type: String, 
        default: '' 
    },
    date_of_birth: { 
        type: Date, 
        required: true 
    },
    gender: { 
        type: String, 
        enum: ['Male', 'Female'], 
        required: true 
    },
    profile_img: { 
        type: imgSchema, 
        default: () => ({}) 
    },
    banner_img: { 
        type: imgSchema, 
        default: () => ({}) 
    },
    social_media_links: { 
        type: [socialLinkSchema], 
        default: [],
        validate: {
            validator: (links: { link_id: string }[]) => {
                const ids = links.map((l) => l.link_id);
                return ids.length === new Set(ids).size;
            },
            message: 'social_media_links contains duplicate link_id values',
        },
    },
    tracks: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Track' 
        }
    ],
    profile_link: { 
        type: String, 
        default: '' 
    },
    links: { 
        type: [socialLinkSchema], 
        default: [],
        validate: {
            validator: (links: { link_id: string }[]) => {
                const ids = links.map((l) => l.link_id);
                return ids.length === new Set(ids).size;
            },
            message: 'links contains duplicate link_id values',
        },
    },
    support_link: { 
        type: String, 
        default: '' 
    },
    liked_playlists: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Playlist' 
        }
    ],
    liked_tracks: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Track' 
        }
    ],
    playlists: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Playlist' 
        }
    ],
    uploads: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Track' 
        }
    ],
    reposts: { 
        type: [repostSchema], 
        default: [] 
    },
    isPaid: { 
        type: Boolean, 
        default: false 
    },
    ban: { 
        type: Boolean, 
        default: false 
    },
    banReason: { 
        type: String, 
        default: '' 
    },
    subscription: {
        subscriptionType: { 
            type: String, 
            default: 'free' 
        },
        quota: { 
            type: quotaSchema, 
            default: () => ({}) 
        },
    },
  },
  { timestamps: true }
);

export default model('User', userSchema);