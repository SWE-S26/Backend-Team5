import { Schema, Types, model } from 'mongoose';

export type ISettings = {
  userId: Types.ObjectId;
  account: {
    dateOfBirth: Date;
    theme: 'Light' | 'Dark' | 'Automatic';
    gender: 'Male' | 'Female';
  };
  content: {
    rssFeedLink: string;
    rssEmailDisplayed: string;
    customFieldTitle: string;
    category: string;
    statsServiceUrlPrefix: string;
    customAuthorName: string;
  };
  privacy: {
    accountIsPrivate: boolean;
    allowMessagesAnyone: boolean;
    showActivityDiscovery: boolean;
    showFirstTopFan: boolean;
    showTrackTopFans: boolean;
    isPrivate: boolean;
  };
  notifications: {
    newFollower: 'email' | 'devices' | 'both' | 'off';
    repostOfYourPost: 'email' | 'devices' | 'both' | 'off';
    newPostByFollowedUser: 'email' | 'devices' | 'both' | 'off';
    likesAndPlaysOnYourPost: 'email' | 'devices' | 'both' | 'off';
    commentOnYourPost: 'email' | 'devices' | 'both' | 'off';
    recommendedContent: 'email' | 'devices' | 'both' | 'off';
    newMessage: {
      email: boolean;
      devices: 'everyone' | 'followed' | 'off';
    };
    updatesFromSoundcloud: 'email' | 'devices' | 'both' | 'off';
    soundcloudFeatureUpdatesEducation: 'email' | 'devices' | 'both' | 'off';
    surveysAndFeedback: 'email' | 'devices' | 'both' | 'off';
    promotionalPartnershipContent: 'email' | 'devices' | 'both' | 'off';
    soundcloudNewsletter: 'email' | 'devices' | 'both' | 'off';
  };
};

const contentSettingsSchema = new Schema(
  {
    rssFeedLink: {
      type: String,
      required: true,
    },
    rssEmailDisplayed: {
      type: String,
      default: '',
    },
    customFieldTitle: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    statsServiceUrlPrefix: {
      type: String,
      default: '',
    },
    customAuthorName: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'English',
    },
    subscriberRedirect: {
      type: String,
      default: '',
    },
    containsExplicitContent: {
      type: Boolean,
      default: false,
    },
    includeInRssFeed: {
      type: Boolean,
      default: false,
    },
    creativeCommonsLicense: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const privacySettingsSchema = new Schema(
  {
    accountIsPrivate: {
      type: Boolean,
      default: false,
    },
    allowMessagesAnyone: {
      type: Boolean,
      default: true,
    },
    showActivityDiscovery: {
      type: Boolean,
      default: true,
    },
    showFirstTopFan: {
      type: Boolean,
      default: true,
    },
    showTrackTopFans: {
      type: Boolean,
      default: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const notificationSettingsSchema = new Schema(
  {
    newFollower: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    repostOfYourPost: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    newPostByFollowedUser: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    likesAndPlaysOnYourPost: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    commentOnYourPost: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    recommendedContent: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    newMessage: {
      email: {
        type: Boolean,
        default: true,
      },
      devices: {
        type: String,
        enum: ['everyone', 'followed', 'off'],
        default: 'everyone',
      },
    },
    updatesFromSoundcloud: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    soundcloudFeatureUpdatesEducation: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    surveysAndFeedback: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'devices',
    },
    promotionalPartnershipContent: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'off',
    },
    soundcloudNewsletter: {
      type: String,
      enum: ['email', 'devices', 'both', 'off'],
      default: 'email',
    },
  },
  { _id: false },
);

const accountSettingsSchema = new Schema(
  {
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
    theme: {
      type: String,
      enum: ['Light', 'Dark', 'Automatic'],
      default: 'Automatic',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    account: {
      type: accountSettingsSchema,
      default: () => ({}),
    },
    content: {
      type: contentSettingsSchema,
      default: () => ({}),
    },
    privacy: {
      type: privacySettingsSchema,
      default: () => ({}),
    },
    notifications: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },
  },
  { timestamps: false },
);

const Settings = model<ISettings>('Settings', settingsSchema);
export default Settings;
