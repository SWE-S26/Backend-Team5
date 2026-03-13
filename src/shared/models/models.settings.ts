import { Schema, model } from 'mongoose';

const contentSettingsSchema = new Schema(
  {
    RSS_feed_link: { 
      type: String,
      required: true,
    },
    RSS_email_displayed: { 
      type: String, 
      default: '' 
    },
    custom_field_title: { 
      type: String, 
      default: '' 
    },
    category: { 
      type: String, 
      default: '' 
    },
    stats_service_url_prefix: { 
      type: String, 
      default: '' 
    },
    custom_author_name: { 
      type: String, 
      default: '' 
    },
    language: { 
      type: String, 
      default: 'English' 
    },
    subscriber_redirect: { 
      type: String, 
      default: '' 
    },
    contains_explicit_content: { 
      type: Boolean, 
      default: false 
    },
    include_in_rss_feed: { 
      type: Boolean, 
      default: false 
    },
    creative_commons_license: { 
      type: Boolean, 
      default: false 
    },
  },
  { _id: false }
);

const privacySettingsSchema = new Schema(
  {
    allow_messages_anyone: { 
      type: Boolean, 
      default: true 
    },
    show_activity_discovery: { 
      type: Boolean, 
      default: true 
    },
    show_first_top_fan: { 
      type: Boolean, 
      default: true 
    },
    show_track_top_fans: { 
      type: Boolean, 
      default: true 
    },
  },
  { _id: false }
);

const notificationSettingsSchema = new Schema(
  {
    new_follower: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    repost_of_your_post: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    new_post_by_followed_user: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    likes_and_plays_on_your_post: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    comment_on_your_post: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    recommended_content: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    new_message: {
      email: { 
        type: Boolean, 
        default: true 
      },
      devices: { 
        type: String, 
        enum: ['everyone', 'followed', 'off'], 
        default: 'everyone' 
      },
    },
    updates_from_soundcloud: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    soundcloud_feature_updates_education: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    surveys_and_feedback: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'devices' 
    },
    promotional_partnership_content: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'off' 
    },
    soundcloud_newsletter: { 
      type: String, 
      enum: ['email', 'devices', 'both', 'off'], 
      default: 'email' 
    },
  },
  { _id: false }
);

const accountSettingsSchema = new Schema(
  {
    date_of_birth: { 
      type: Date,
      required: true
    },
    theme: { 
      type: String, 
      enum: ['Light', 'Dark', 'Automatic'], 
      default: 'Automatic' 
    },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    account: { 
      type: accountSettingsSchema, 
      default: () => ({}) 
    },
    content: { 
      type: contentSettingsSchema, 
      default: () => ({}) 
    },
    privacy: { 
      type: privacySettingsSchema, 
      default: () => ({}) 
    },
    notifications: { 
      type: notificationSettingsSchema, 
      default: () => ({}) 
    },
  },
  { timestamps: false }
);

export default model('Settings', settingsSchema);