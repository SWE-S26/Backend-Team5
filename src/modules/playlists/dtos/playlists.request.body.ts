import extendedZod from '../../../shared/docs/dtoDocumenter';
export const CreatePlaylistsRequestBodyDTO = extendedZod
  .object({
    playlistName: extendedZod.string().min(1).max(100),
    tracks: extendedZod.array(extendedZod.mongoId()).max(150),
    isPrivate: extendedZod.boolean(),
  })
  .openapi('CreatePlaylistsRequest', {
    example: {
      playlistName: 'My Playlist',
      tracks: ['60c72b2f9b1d4c0015b8e8f1', '60c72b2f9b1d4c0015b8e8f2'],
      isPrivate: false,
    },
  });

export const UpdatePlaylistSingleTrackOrderRequestBodyDTO = extendedZod.object({
  trackId: extendedZod.mongoId(),
  oldPosition: extendedZod.number().min(0).max(150),
  newPosition: extendedZod.number().min(0).max(150),
});

export const UpdatePlaylistInfoRequestBodyDTO = extendedZod
  .object({
    title: extendedZod.string().min(1).max(100),
    description: extendedZod.string().max(500),
    genre: extendedZod.string().max(50),
    permalink: extendedZod.string().min(1).max(100),
    listOfTracks: extendedZod.array(extendedZod.mongoId()).max(150),
    additionalTags: extendedZod.array(extendedZod.string().max(30)),
    releaseDate: extendedZod.coerce
      .date()
      .min(new Date('1950-01-01'))
      .optional(),
    type: extendedZod.enum(['public', 'private']),
    playlistType: extendedZod.enum([
      'playlist',
      'album',
      'compilation',
      'single',
    ]),
    rssFeedLink: extendedZod.string().optional(),
    recordLabel: extendedZod.string().max(100).optional(),
  })
  .openapi('UpdatePlaylistInfoRequest', {
    example: {
      title: 'Updated Playlist Title',
      description: 'Updated description for my playlist',
      genre: 'Rock',
      additionalTags: ['tag1', 'tag2'],
      releaseDate: '2023-01-01',
      type: 'public',
      playlistType: 'playlist',
      rssFeedLink: 'https://example.com/rss-feed.xml',
      recordLabel: 'Example Record Label',
    },
  });
