import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';
import { Types } from 'mongoose';
import { PublitioUploadResult } from '../../../shared/abstractions/publitio.service';
import { GeoblockingMode } from '../../../shared/models/models.track';
import {
  Region,
  Country,
  ValidCountries,
  ValidRegions,
  GeoblockingModeValues,
} from '../tracks.consts';

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
      .optional()
      .default(''),
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
    ISWC: extendedZod
      .string()
      .regex(
        /^T-\d{9}-\d$/,
        'ISWC must be in format T-XXXXXXXXX-C (e.g. T-034524680-1)',
      )
      .optional(),
    albumTitle: extendedZod.string().optional(),
    releaseTitle: extendedZod.string().optional(),
  }),
  mobileProPreview: extendedZod.coerce.boolean().optional(),
});

export const CreateTrackRequestBodyDTOV2 = CreateTrackRequestBodyDTO.extend({
  geoBlocking: extendedZod
    .object({
      mode: extendedZod
        .enum(GeoblockingModeValues)
        .default(GeoblockingMode.WORLDWIDE),
      regions: extendedZod.array(extendedZod.enum(ValidRegions)).default([]),
      countries: extendedZod
        .array(extendedZod.enum(ValidCountries))
        .default([]),
    })
    .refine((data) => {
      if (data.mode === GeoblockingMode.WORLDWIDE) {
        return data.regions.length === 0 && data.countries.length === 0;
      }
      return data.regions.length > 0 || data.countries.length > 0;
    })
    .default({
      mode: 'worldwide',
      regions: [],
      countries: [],
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

export const UpdateTrackRequestBodyDTOV2 = extendedZod.object({
  id: extendedZod.string(),
  basicInfo: CreateTrackRequestBodyDTOV2.shape.basicInfo.partial(),
  permissions: CreateTrackRequestBodyDTOV2.shape.permissions.partial(),
  license: CreateTrackRequestBodyDTOV2.shape.license.partial(),
  advanced: CreateTrackRequestBodyDTOV2.shape.advanced.partial(),
  geoBlocking: CreateTrackRequestBodyDTOV2.shape.geoBlocking.optional(),
  mobileProPreview: extendedZod.boolean().optional(),
});

export const UpdateTrackMobileProPreviewRequestBodyDTO = extendedZod.object({
  mobileProPreview: extendedZod.boolean(),
});

export type TrackInput = {
  trackInfo: {
    basicInfo: CreateTrackDTO['basicInfo'];
    audio: {
      waveformLink: string;
    } & PublitioUploadResult;
    image?: ImageInfo;
    posterId: Types.ObjectId;
    numOfPlays: number;
    numberOfReposts: number;
    numOfDownloads: number;
    numOfLikes: number;
    durationInSeconds: number;
    likedBy: Types.ObjectId[];
    comments: Types.ObjectId[];
    permissions: CreateTrackDTO['permissions'];
    license: CreateTrackDTO['license'];
    composer: string;
    releaseTitle: string;
    hidden: boolean;
    audioClip: {
      start: number;
      end: number;
    };
    mobileProPreview?: boolean;
  };
  advanced: {
    buyLink: string;
    recordLabel: string;
    releaseDate: string;
    publisher: string;
    isrc: string;
    iswc: string;
    explicitContent: boolean;
    pLine: string;
    albumTitle: string;
  };
};

export type TrackInputV2 = TrackInput & {
  trackInfo: TrackInput['trackInfo'] & {
    geoBlocking: {
      mode: (typeof GeoblockingModeValues)[number];
      regions: string[];
      countries: string[];
    };
  };
};

export type CreateTrackDTO = z.infer<typeof CreateTrackRequestBodyDTO>;
export type CreateTrackDTOV2 = z.infer<typeof CreateTrackRequestBodyDTOV2>;
export type UpdateTrackDTO = z.infer<typeof UpdateTrackRequestBodyDTO>;
export type UpdateTrackDTOV2 = z.infer<typeof UpdateTrackRequestBodyDTOV2>;

export const IncrementTrackNumPlaysRequestBodyDTO = extendedZod.object({
  trackId: extendedZod.string(),
  listenedDuration: extendedZod.coerce.number(),
  sessionIdPlay: extendedZod.uuid(),
});

export const DownloadTrackIncrementRequestBodyDTO = extendedZod.object({
  trackId: extendedZod.string(),
  sessionIdDownload: extendedZod.uuid(),
});
