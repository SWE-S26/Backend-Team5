import extendedZod from '../../../shared/docs/dtoDocumenter';

export const AdminUserSnippetResponseDTO = extendedZod
  .object({
    userId: extendedZod.string(),
    displayName: extendedZod.string(),
    email: extendedZod.string().email(),
    role: extendedZod.enum(['Listener', 'Pro', 'Admin']),
    suspended: extendedZod.boolean(),
    createdAt: extendedZod.string().datetime(),
    uploadedTracksCount: extendedZod.number().int().min(0),
    followersCount: extendedZod.number().int().min(0),
  })
  .openapi('AdminUserSnippet', {
    example: {
      userId: 'usr_001',
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Listener',
      suspended: false,
      createdAt: '2025-01-10T09:00:00Z',
      uploadedTracksCount: 12,
      followersCount: 95,
    },
  });

export const AdminUserListResponseDTO = extendedZod
  .object({
    total: extendedZod.number().int().min(0),
    offset: extendedZod.number().int().min(1),
    limit: extendedZod.number().int().min(1),
    users: extendedZod.array(AdminUserSnippetResponseDTO),
  })
  .openapi('AdminUserListResponse', {
    example: {
      total: 2,
      offset: 1,
      limit: 20,
      users: [
        {
          userId: 'usr_001',
          displayName: 'John Doe',
          email: 'john.doe@example.com',
          role: 'Pro',
          suspended: false,
          createdAt: '2025-01-10T09:00:00Z',
          uploadedTracksCount: 12,
          followersCount: 95,
        },
      ],
    },
  });

export const AdminMediaSnippetResponseDTO = extendedZod
  .object({
    title: extendedZod.string(),
    artistName: extendedZod.string(),
    type: extendedZod.enum(['track']),
    numberOfPlays: extendedZod.number().int().min(0),
    numberOfLikes: extendedZod.number().int().min(0),
    banned: extendedZod.boolean(),
    createdAt: extendedZod.string().datetime(),
  })
  .openapi('AdminMediaSnippet', {
    example: {
      title: 'Summer Vibes',
      artistName: 'DJ Cool',
      type: 'track',
      numberOfPlays: 1200,
      numberOfLikes: 540,
      banned: false,
      createdAt: '2025-01-10T09:00:00Z',
    },
  });

export const AdminMediaListResponseDTO = extendedZod
  .object({
    total: extendedZod.number().int().min(0),
    offset: extendedZod.number().int().min(1),
    limit: extendedZod.number().int().min(1),
    items: extendedZod.array(AdminMediaSnippetResponseDTO),
  })
  .openapi('AdminMediaListResponse', {
    example: {
      total: 2,
      offset: 1,
      limit: 20,
      items: [
        {
          title: 'Summer Vibes',
          artistName: 'DJ Cool',
          type: 'track',
          numberOfPlays: 1200,
          numberOfLikes: 540,
          banned: false,
          createdAt: '2025-01-10T09:00:00Z',
        },
      ],
    },
  });

export const ReportResponseDTO = extendedZod
  .object({
    reportId: extendedZod.string(),
    reportedId: extendedZod.string(),
    violatorId: extendedZod.string(),
    violatorType: extendedZod.enum(['user', 'track']),
    reason: extendedZod.string(),
    status: extendedZod.enum(['pending', 'done']),
    createdAt: extendedZod.string().datetime(),
  })
  .openapi('Report', {
    example: {
      reportId: '507f1f77bcf86cd799439013',
      reportedId: '507f1f77bcf86cd799439011',
      violatorId: '507f1f77bcf86cd799439012',
      violatorType: 'track',
      reason: 'This track contains abusive content.',
      status: 'pending',
      createdAt: '2025-01-12T08:00:00Z',
    },
  });

export const AdminAnalyticsOverviewResponseDTO = extendedZod
  .object({
    totalUsers: extendedZod.number().int().min(0),
    proToListenersRatio: extendedZod.number().min(0),
    totalTracks: extendedZod.number().int().min(0),
    totalPlays: extendedZod.number().int().min(0),
  })
  .openapi('AdminAnalyticsOverviewResponse', {
    example: {
      totalUsers: 1520,
      proToListenersRatio: 0.08,
      totalTracks: 420,
      totalPlays: 50000,
    },
  });

export const AdminAnalyticsStorageResponseDTO = extendedZod
  .object({
    usedBytes: extendedZod.number().int().min(0),
  })
  .openapi('AdminAnalyticsStorageResponse', {
    example: {
      usedBytes: 524288000,
    },
  });
