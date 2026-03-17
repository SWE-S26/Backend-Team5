import { Schema, Types, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

export type IUser = {
  _id: Types.ObjectId;
  email: string;
  password: string;
  googleId?: string;
  role: 'Listener/Artist' | 'Admin';
  displayName: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  bio: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
  isVerified: boolean;
  profileImg: {
    imgLink: string;
    publicId: string;
  };
  bannerImg: {
    imgLink: string;
    publicId: string;
  };
  socialMediaLinks: [
    {
      name: string;
      link: string;
    },
  ];
  tracks: [Types.ObjectId];
  profileLink: string;
  links: [
    {
      name: string;
      link: string;
    },
  ];
  supportLink: string;
  likedPlaylists: [Types.ObjectId];
  likedTracks: [Types.ObjectId];
  playlists: [Types.ObjectId];
  uploads: [Types.ObjectId];
  reposts: [
    {
      id: string;
      caption: string;
      type: 'track' | 'playlist';
      timestamp: Date;
    },
  ];
  isPaid: boolean;
  ban: boolean;
  banReason: string;
  subscription: {
    subscriptionType: string;
    quota: {
      unlimited: boolean;
      usedSeconds: number;
      leftSeconds: number;
    };
  };
};

const socialLinkSchema = new Schema(
  {
    name: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
  },
);

const repostSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['track', 'playlist'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const quotaSchema = new Schema(
  {
    unlimited: {
      type: Boolean,
      default: false,
    },
    usedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    leftSeconds: {
      type: Number,
      default: 120,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['Listener/Artist', 'Admin'],
      required: true,
      default: 'Listener/Artist',
    },
    displayName: {
      type: String,
      default: '',
      required: true,
      minlength: 1,
      maxlength: 50,
    },
    firstName: {
      type: String,
      default: '',
      maxlength: 50,
    },
    lastName: {
      type: String,
      default: '',
      maxlength: 50,
    },
    city: {
      type: String,
      default: '',
      maxlength: 50,
    },
    country: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      min: new Date('1950-01-01'),
      validate: {
        validator: (v: Date) => {
          const d = new Date();
          d.setFullYear(d.getFullYear() - 13);
          return v <= d;
        },
        message: 'Must be at least 13 years old',
      },
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileImg: {
      type: imgSchema,
    },
    bannerImg: {
      type: imgSchema,
    },
    socialMediaLinks: {
      type: [socialLinkSchema],
      default: [],
    },
    tracks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    profileLink: {
      type: String,
      required: true,
    },
    links: {
      type: [socialLinkSchema],
      default: [],
    },
    supportLink: {
      type: String,
      default: '',
    },
    likedPlaylists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Playlist',
      },
    ],
    likedTracks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    playlists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Playlist',
      },
    ],
    uploads: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    reposts: {
      type: [repostSchema],
      default: [],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    ban: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: '',
      maxlength: 500,
    },
    subscription: {
      subscriptionType: {
        type: String,
        default: 'free',
      },
      quota: {
        type: quotaSchema,
        default: () => ({}),
      },
    },
  },
  { timestamps: true },
);

const User = model<IUser>('User', userSchema);
export default User;
