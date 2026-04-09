import extendedZod from '../../../shared/docs/dtoDocumenter';
import z from 'zod';

export const LinkDTO = extendedZod.object({
  name: extendedZod.string().nullable().optional(),
  link: extendedZod.string().url(),
});

export const UpdateProfileRequestBodyDTO = extendedZod.object({
  displayName: extendedZod.string().trim().min(1).optional(),
  firstName: extendedZod.string().trim().min(1).nullable().optional(),
  lastName: extendedZod.string().trim().min(1).nullable().optional(),
  profileLink: extendedZod.string().trim().min(1).optional(),
  bio: extendedZod.string().trim().min(1).nullable().optional(),
  city: extendedZod.string().trim().min(1).nullable().optional(),
  country: extendedZod.string().trim().min(1).nullable().optional(),
  links: extendedZod.array(LinkDTO).optional(),
  bannerLinks: extendedZod.array(LinkDTO).optional(),
  supportLink: extendedZod.string().url().nullable().optional(),
  favoriteGenres: extendedZod
    .array(extendedZod.string().trim().min(1))
    .optional(),
  isPrivate: extendedZod.boolean().optional(),
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
  removeProfileImg: extendedZod.preprocess(
    (val) => val === 'true',
    extendedZod.boolean(),
  ),
  removeBannerImg: extendedZod.preprocess(
    (val) => val === 'true',
    extendedZod.boolean(),
  ),
});

export type UpdateProfileImagesRequestBodyDTOType = z.infer<
  typeof UpdateProfileImagesRequestBodyDTO
>;

export const UpdateAccountSettingsDTO = extendedZod.object({
  theme: extendedZod.enum(['Light', 'Dark', 'Automatic']).optional(),
  dateOfBirth: extendedZod
    .preprocess(
      (value) => {
        if (typeof value === 'string' || value instanceof String)
          return new Date(value as string);
        return value;
      },
      extendedZod
        .date()
        .min(new Date('1950-01-01'), '')
        .refine((dob) => {
          const diff = new Date().getTime() - dob.getTime();
          const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
          return age >= 13;
        }, "Users' age doesn't meet BeatZa's minimum age requirements"),
    )
    .optional(),
  gender: extendedZod.enum(['Male', 'Female']).optional(),
});

export type UpdateAccountSettingsDTOType = z.infer<
  typeof UpdateAccountSettingsDTO
>;

export const UpdateContentSettingsDTO = extendedZod.object({
  rssFeedLink: extendedZod.string().url().optional(),
  rssEmailDisplayed: extendedZod.string().trim().min(1).optional(),
  customFieldTitle: extendedZod.string().trim().min(1).optional(),
  category: extendedZod.string().trim().min(1).optional(),
  statsServiceUrlPrefix: extendedZod.string().url().optional(),
  customAuthorName: extendedZod.string().trim().min(1).optional(),
  language: extendedZod.string().trim().min(1).optional(),
  subscriberRedirect: extendedZod.string().url().optional(),
  containsExplicitContent: extendedZod.boolean().optional(),
  includeInRssFeed: extendedZod.boolean().optional(),
  creativeCommonsLicense: extendedZod.boolean().optional(),
});

export type UpdateContentSettingsDTOType = z.infer<
  typeof UpdateContentSettingsDTO
>;

export const UpdatePrivacySettingsDTO = extendedZod.object({
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
