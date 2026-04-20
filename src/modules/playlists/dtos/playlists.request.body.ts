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
