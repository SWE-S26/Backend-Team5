import extendedZod from '../../../shared/docs/dtoDocumenter';
import { z } from 'zod';

export const TrackResponse = extendedZod.object({
  _id: extendedZod.string(),
  basicInfo: extendedZod.object({
    title: extendedZod.string(),
    permalink: extendedZod.string(),
    mainArtists: extendedZod.array(extendedZod.string()),
    genre: extendedZod.string(),
    tags: extendedZod.array(extendedZod.string()),
    description: extendedZod.string(),
    isPrivate: extendedZod.boolean(),
  }),
  audioUrl: extendedZod.string(),
  imageUrl: extendedZod.string(),
  numLikes: extendedZod.number(),
  numPlays: extendedZod.number(),
  numReposts: extendedZod.number(),
  releaseDate: extendedZod.date(),
});

export type TrackResponseDTO = z.infer<typeof TrackResponse>;
