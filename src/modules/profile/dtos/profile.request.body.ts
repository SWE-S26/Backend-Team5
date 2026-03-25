import extendedZod from '../../../shared/docs/dtoDocumenter';
import z from 'zod';

export const LinkDTO = extendedZod.object({
  name: extendedZod.string().nullable().optional(),
  link: extendedZod.string().url(),
});

export const UpdateProfileRequestBodyDTO = extendedZod.object({
  displayName: extendedZod.string().optional(),
  firstName: extendedZod.string().nullable().optional(),
  lastName: extendedZod.string().nullable().optional(),
  profileLink: extendedZod.string().optional(),
  bio: extendedZod.string().nullable().optional(),
  city: extendedZod.string().nullable().optional(),
  country: extendedZod.string().nullable().optional(),
  links: extendedZod.array(LinkDTO).optional(),
  bannerLinks: extendedZod.array(LinkDTO).optional(),
  supportLink: extendedZod.string().url().nullable().optional(),
  favoriteGenres: extendedZod.array(extendedZod.string()).optional(),
});

export type UpdateProfileRequestBodyDTOType = z.infer<
  typeof UpdateProfileRequestBodyDTO
> & {
  profileImg?: {
    imgLink: string;
    publicId: string;
  };
  bannerImg?: {
    imgLink: string;
    publicId: string;
  };
};

export const UpdateProfileImagesRequestBodyDTO = extendedZod.object({
  removeProfileImg: extendedZod.coerce.boolean().optional(),
  removeBannerImg: extendedZod.coerce.boolean().optional(),
});

export type UpdateProfileImagesRequestBodyDTOType = z.infer<
  typeof UpdateProfileImagesRequestBodyDTO
>;

export const UpdateAccountSettingsDTO = extendedZod.object({
  theme: extendedZod.enum(['Light', 'Dark', 'Automatic']).optional(),
  dateOfBirth: extendedZod.string().optional(), // format date
  gender: extendedZod.enum(['Male', 'Female']).optional(),
});

export type UpdateAccountSettingsDTOType = z.infer<
  typeof UpdateAccountSettingsDTO
>;

export const UpdateContentSettingsDTO = extendedZod.object({
  rssFeedLink: extendedZod.string().optional(),
  rssEmailDisplayed: extendedZod.string().optional(),
  customFieldTitle: extendedZod.string().optional(),
  category: extendedZod.string().optional(),
  statsServiceUrlPrefix: extendedZod.string().optional(),
  customAuthorName: extendedZod.string().optional(),
  language: extendedZod.string().optional(),
  subscriberRedirect: extendedZod.string().optional(),
  containsExplicitContent: extendedZod.boolean().optional(),
  includeInRssFeed: extendedZod.boolean().optional(),
  creativeCommonsLicense: extendedZod.boolean().optional(),
});

export type UpdateContentSettingsDTOType = z.infer<
  typeof UpdateContentSettingsDTO
>;

export const UpdatePrivacySettingsDTO = extendedZod.object({
  accountIsPrivate: extendedZod.boolean().optional(),
  allowMessagesAnyone: extendedZod.boolean().optional(),
  showActivityDiscovery: extendedZod.boolean().optional(),
  showFirstTopFan: extendedZod.boolean().optional(),
  showTrackTopFans: extendedZod.boolean().optional(),
});

export type UpdatePrivacySettingsDTOType = z.infer<
  typeof UpdatePrivacySettingsDTO
>;

export const UpdateNotificationsSettingsDTO = extendedZod.object({
  newFollower: extendedZod.enum(['email', 'devices', 'both', 'off']).optional(),
  repostOfYourPost: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  newPostByFollowedUser: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  likesAndPlaysOnYourPost: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  commentOnYourPost: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  recommendedContent: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  newMessage: extendedZod
    .object({
      email: extendedZod.boolean().optional(),
      devices: extendedZod.enum(['everyone', 'followed', 'off']).optional(),
    })
    .optional(),
  updatesFromSoundcloud: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  soundcloudFeatureUpdatesEducation: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  surveysAndFeedback: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  promotionalPartnershipContent: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
  soundcloudNewsletter: extendedZod
    .enum(['email', 'devices', 'both', 'off'])
    .optional(),
});

export type UpdateNotificationsSettingsDTOType = z.infer<
  typeof UpdateNotificationsSettingsDTO
>;
