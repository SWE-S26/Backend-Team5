import extendedZod from '../../../shared/docs/dtoDocumenter';

export const AdminUserSnippetResponseDTO = extendedZod
  .object({
    userId: extendedZod.string(),
    displayName: extendedZod.string(),
    email: extendedZod.string().email(),
    role: extendedZod.enum(['user', 'admin']),
    subscriptionType: extendedZod.enum(['free', 'pro']).optional(),
    suspended: extendedZod.boolean(),
    createdAt: extendedZod.string().datetime(),
  })
  .openapi('AdminUserSnippet', {
    example: {
      userId: 'usr_001',
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'user',
      subscriptionType: 'free',
      suspended: false,
      createdAt: '2025-01-10T09:00:00Z',
    },
  });

export const ReportResponseDTO = extendedZod
  .object({
    reportId: extendedZod.string(),
    reporterId: extendedZod.string(),
    violatorId: extendedZod.string(),
    violatorType: extendedZod.enum(['user', 'track', 'comment']),
    complaintType: extendedZod.string(),
    status: extendedZod.enum(['pending', 'resolved', 'dismissed']),
    body: extendedZod.string().optional(),
    adminNote: extendedZod.string().optional(),
    createdAt: extendedZod.string().datetime(),
    resolvedAt: extendedZod.string().datetime().optional(),
  })
  .openapi('Report', {
    example: {
      reportId: 'rep_123',
      reporterId: 'usr_001',
      violatorId: 'usr_002',
      violatorType: 'track',
      complaintType: 'spam',
      status: 'pending',
      createdAt: '2025-01-12T08:00:00Z',
    },
  });

export const ArtistAnalyticsOverviewResponseDTO = extendedZod
  .object({
    totalPlays: extendedZod.number().int().min(0),
    totalLikes: extendedZod.number().int().min(0),
    totalReposts: extendedZod.number().int().min(0),
    totalComments: extendedZod.number().int().min(0),
    totalFollowers: extendedZod.number().int().min(0),
    uniqueListeners: extendedZod.number().int().min(0),
    period: extendedZod.string().optional(),
  })
  .openapi('ArtistAnalyticsOverviewResponse', {
    example: {
      totalPlays: 50000,
      totalLikes: 3200,
      totalReposts: 410,
      totalComments: 780,
      totalFollowers: 1200,
      uniqueListeners: 8500,
      period: 'last_30_days',
    },
  });
