import extendedZod from '../../../shared/docs/dtoDocumenter';

export const PlaylistsResponseDto = extendedZod
  .object({
    id: extendedZod.string(),
    email: extendedZod.string(),
    name: extendedZod.string(),
    role: extendedZod.enum(['user', 'admin']),
  })
  .openapi('PlaylistsResponse', {
    example: {
      id: '697b7c75001e8cb1d4c0bb67',
      email: 'user@example.com',
      name: 'cow',
      role: 'user',
    },
  });
