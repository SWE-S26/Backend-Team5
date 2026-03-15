import { Schema, model } from 'mongoose';
import { imgSchema } from './schemas.shared';

export type IUser = {
  _id: String;
  email: String;
  password: String;
  role: 'Listener/Artist' | 'Admin';
  displayName: String;
  firstName: String;
  lastName: String;
  city: String;
  country: String;
  bio: String;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
  isVerified: Boolean;
  profileImg: {
    url: String;
    publicId: String;
  };
  bannerImg: {
    url: String;
    publicId: String;
  };
  socialMediaLinks: [
    {
      name: String;
      link: String;
    },
  ];
  tracks: [String];
  profileLink: String;
  links: [
    {
      name: String;
      link: String;
    },
  ];
  supportLink: String;
  likedPlaylists: [String];
  likedTracks: [String];
  playlists: [String];
  uploads: [String];
  reposts: [
    {
      id: String;
      caption: String;
      type: 'track' | 'playlist';
      timestamp: Date;
    },
  ];
  isPaid: Boolean;
  ban: Boolean;
  banReason: String;
  subscription: {
    subscriptionType: String;
    quota: {
      unlimited: Boolean;
      usedSeconds: Number;
      leftSeconds: Number;
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
      required: true,
      select: false,
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
