import z from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';
import { LinkDTO } from './profile.request.body';

export const ProfileResponseDTO = extendedZod.object({
  userId: extendedZod.mongoId(),
  displayName: extendedZod.string(),
  firstName: extendedZod.string().nullable(),
  lastName: extendedZod.string().nullable(),
  profileLink: extendedZod.string(),
  profileImgLink: extendedZod.string().url().nullable(),
  bannerImgLink: extendedZod.string().url().nullable(),
  bio: extendedZod.string().nullable(),
  city: extendedZod.string().nullable(),
  country: extendedZod.string().nullable(),
  links: extendedZod.array(LinkDTO).optional(),
  bannerLinks: extendedZod.array(LinkDTO).optional(),
  supportLink: extendedZod.string().url().nullable().optional(),
  favoriteGenres: extendedZod.array(extendedZod.string()).optional(),
  isPaid: extendedZod.boolean(),
  isPrivate: extendedZod.boolean(),
  followersCount: extendedZod.number().optional(),
  followedCount: extendedZod.number().optional(),
  trackCount: extendedZod.number().optional(),
});

export type ProfileResponseDTOType = z.infer<typeof ProfileResponseDTO>;

export const AccountSettingsResponseDTO = extendedZod.object({
  theme: extendedZod.enum(['Light', 'Dark', 'Automatic']),
  dateOfBirth: extendedZod.string(),
  gender: extendedZod.enum(['Male', 'Female']),
});

export const ContentSettingsResponseDTO = extendedZod.object({
  rssFeedLink: extendedZod.string(),
  rssEmailDisplayed: extendedZod.string(),
  customFieldTitle: extendedZod.string(),
  category: extendedZod.string(),
  statsServiceUrlPrefix: extendedZod.string(),
  customAuthorName: extendedZod.string(),
  language: extendedZod.string(),
  subscriberRedirect: extendedZod.string(),
  containsExplicitContent: extendedZod.boolean(),
  includeInRssFeed: extendedZod.boolean(),
  creativeCommonsLicense: extendedZod.boolean(),
});

export const PrivacySettingsResponseDTO = extendedZod.object({
  allowMessagesAnyone: extendedZod.boolean(),
  showActivityDiscovery: extendedZod.boolean(),
  showFirstTopFan: extendedZod.boolean(),
  showTrackTopFans: extendedZod.boolean(),
});

export const NotificationsSettingsResponseDTO = extendedZod.object({
  newFollower: extendedZod.enum(['email', 'devices', 'both', 'off']),
  repostOfYourPost: extendedZod.enum(['email', 'devices', 'both', 'off']),
  newPostByFollowedUser: extendedZod.enum(['email', 'devices', 'both', 'off']),
  likesAndPlaysOnYourPost: extendedZod.enum([
    'email',
    'devices',
    'both',
    'off',
  ]),
  commentOnYourPost: extendedZod.enum(['email', 'devices', 'both', 'off']),
  recommendedContent: extendedZod.enum(['email', 'devices', 'both', 'off']),
  newMessage: extendedZod.object({
    email: extendedZod.boolean(),
    devices: extendedZod.enum(['everyone', 'followed', 'off']),
  }),
  updatesFromSoundcloud: extendedZod.enum(['email', 'devices', 'both', 'off']),
  soundcloudFeatureUpdatesEducation: extendedZod.enum([
    'email',
    'devices',
    'both',
    'off',
  ]),
  surveysAndFeedback: extendedZod.enum(['email', 'devices', 'both', 'off']),
  promotionalPartnershipContent: extendedZod.enum([
    'email',
    'devices',
    'both',
    'off',
  ]),
  soundcloudNewsletter: extendedZod.enum(['email', 'devices', 'both', 'off']),
});
