import extendedZod from '../../../shared/docs/dtoDocumenter';
import { UpdateTrackDTO } from './tracks.request.body';
import { z } from 'zod';

export const TrackResponsePublic = extendedZod.object({
  trackId: extendedZod.string(),
  basicInfo: extendedZod.object({
    title: extendedZod.string(),
    permalink: extendedZod.string(),
    mainArtists: extendedZod.array(extendedZod.string()),
    genre: extendedZod.string(),
    tags: extendedZod.array(extendedZod.string()),
    description: extendedZod.string(),
    isPrivate: extendedZod.boolean(),
  }),
  audio: extendedZod.object({
    id: extendedZod.string(),
    url: extendedZod.string(),
  }),
  image: extendedZod.object({
    url: extendedZod.string(),
    publicId: extendedZod.string(),
  }),
  posterId: extendedZod.string(),
  durationInSeconds: extendedZod.number(),
  numLikes: extendedZod.number(),
  numPlays: extendedZod.number(),
  numReposts: extendedZod.number(),
  numComments: extendedZod.number(),
  releaseDate: extendedZod.date(),
  permissions: z.object({
    enableDirectDownload: z.boolean(),
    offlineListening: z.boolean(),
    includeInRssFeed: z.boolean(),
    displayedEmbedCode: z.boolean(),
    enableAppPlayback: z.boolean(),
  }),
  license: extendedZod.object({
    type: extendedZod.enum(['allRightsReserved', 'creativeCommons']),
    attribution: z.boolean(),
    nonCommercial: z.boolean(),
    noDerivativeWorks: z.boolean(),
    shareAlike: z.boolean(),
  }),
  audioClip: extendedZod.object({
    start: extendedZod.number().default(0),
    end: extendedZod.number().default(0),
  }),
});

export const TrackResponsePrivate = TrackResponsePublic.extend({
  isLikedByUser: extendedZod.boolean(),
});

export type TrackResponsePublicDTO = z.infer<typeof TrackResponsePublic>;
export type TrackResponsePrivateDTO = z.infer<typeof TrackResponsePrivate>;

export const PaginationResponse = extendedZod.object({
  tracks: extendedZod.array(
    extendedZod.union([TrackResponsePublic, TrackResponsePrivate]),
  ),
  paginationInfo: extendedZod.object({
    totalNumTracks: extendedZod.number(),
    page: extendedZod.number(),
    totalPages: extendedZod.number(),
    hasNext: extendedZod.boolean(),
  }),
});

export type TrackDetailedInfo = UpdateTrackDTO;

export type PaginationResponseDTO = z.infer<typeof PaginationResponse>;
