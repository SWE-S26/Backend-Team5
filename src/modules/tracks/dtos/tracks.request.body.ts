import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';
import { Types } from 'mongoose';
import { PublitioUploadResult } from '../../../shared/abstractions/publitio';
import { CloudinaryUploadResult } from '../../../shared/abstractions/cloudinary.service';

type ImageInfo = {
  imgLink: string;
  publicId: string;
};

export const CreateTrackRequestBodyDTO = extendedZod.object({
  basicInfo: extendedZod.object({
    title: extendedZod.string(),
    permalink: extendedZod
      .string()
      .regex(
        /^[a-z0-9_-]+$/,
        'Use only lowercase letters, numbers, underscores, or hyphens.',
      )
      .regex(/[a-z0-9_-]/, 'Permalink cannot be only digits.'),
    mainArtists: extendedZod
      .array(extendedZod.string().min(1, 'Cannot Be Empty'))
      .min(1, 'At least one artist is required'),
    genre: extendedZod
      .string()
      .optional()
      .transform((value) => value?.trim()),
    tags: extendedZod
      .array(extendedZod.string().min(1, 'Cannot Be Empty'))
      .min(1, 'At least tag  is required')
      .optional(),
    description: extendedZod
      .string()
      .min(1, 'Cannot Be Empty')
      .transform((value) => value?.trim())
      .optional(),
    isPrivate: extendedZod.boolean().default(false),
    caption: extendedZod.string().optional(),
  }),
  permissions: extendedZod.object({
    enableDirectDownload: extendedZod.boolean().default(false),
    offlineListening: extendedZod.boolean().default(true),
    includeInRssFeed: extendedZod.boolean().default(true),
    displayedEmbedCode: extendedZod.boolean().default(true),
    enableAppPlayback: extendedZod.boolean().default(true),
  }),
  license: extendedZod.object({
    type: extendedZod
      .enum(['allRightsReserved', 'creativeCommons'])
      .default('allRightsReserved'),
    attribution: extendedZod.boolean().default(false),
    nonCommercial: extendedZod.boolean().default(false),
    noDerivativeWorks: extendedZod.boolean().default(false),
    shareAlike: extendedZod.boolean().default(false),
  }),
  advanced: extendedZod.object({
    buyLink: extendedZod.string().optional(),
    recordLabel: extendedZod.string().optional(),
    releaseDate: extendedZod
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid date format, must be ISO 8601',
      }),
    publisher: extendedZod.string().optional(),
    ISRC: extendedZod
      .string()
      // CC-XXX-YY-NNNNN
      // CC - Country code
      // XXX - Registrant code
      // YY - Year of reference
      // NNNNN - Designation code
      .regex(
        /^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}/,
        'An ISRC (International Standard Recording Code) is a unique identifier that is assigned to a track. Use the same ISRC for a given track wherever you distribute it.',
      )
      .optional(),
    explicitContent: extendedZod.boolean().default(false),
    pLine: extendedZod.string().optional(),
    audioClipStart: extendedZod.number().optional(),
    audioClipEnd: extendedZod.number().optional(),
    composer: extendedZod.string().optional(),
    ISWC: extendedZod.string().optional(),
    albumTitle: extendedZod.string().optional(),
  }),
});

// a copy for the patch request but all are optional
export const UpdateTrackRequestBodyDTO = extendedZod.object({
  id: extendedZod.string(),
  basicInfo: CreateTrackRequestBodyDTO.shape.basicInfo.partial(),
  permissions: CreateTrackRequestBodyDTO.shape.permissions.partial(),
  license: CreateTrackRequestBodyDTO.shape.license.partial(),
  advanced: CreateTrackRequestBodyDTO.shape.advanced.partial(),
});

export type TrackInput = {
  trackInfo: {
    basicInfo: CreateTrackDTO['basicInfo'];
    audio: PublitioUploadResult;
    image?: ImageInfo;
    posterId: Types.ObjectId;
    numOfPlays: number;
    numberOfReposts: number;
    numOfLikes: number;
    likedBy: Types.ObjectId[];
    comments: Types.ObjectId[];
    permissions: CreateTrackDTO['permissions'];
    license: CreateTrackDTO['license'];
  };
  advanced: CreateTrackDTO['advanced'];
};

export type CreateTrackDTO = z.infer<typeof CreateTrackRequestBodyDTO>;
export type UpdateTrackDTO = z.infer<typeof UpdateTrackRequestBodyDTO>;
