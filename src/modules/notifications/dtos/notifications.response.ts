import extendedZod from '../../../shared/docs/dtoDocumenter';

export const NotificationActorResponseDTO = extendedZod
  .object({
    userId: extendedZod.string(),
    displayName: extendedZod.string(),
    avatarUrl: extendedZod.string().url().optional(),
  })
  .openapi('NotificationActorResponse', {
    example: {
      userId: 'usr_001',
      displayName: 'Jane Smith',
      avatarUrl: 'https://cdn.example.com/avatars/usr_001.jpg',
    },
  });

export const NotificationTargetResponseDTO = extendedZod
  .object({
    targetType: extendedZod.enum(['track', 'comment', 'user']),
    targetId: extendedZod.string(),
    title: extendedZod.string().optional(),
    trackId: extendedZod.string().optional(),
    commentText: extendedZod.string().optional(),
    mentionedUserProfileLink: extendedZod.string().optional(),
  })
  .openapi('NotificationTargetResponse', {
    example: {
      targetType: 'track',
      targetId: 'trk_456',
      title: 'My Awesome Track',
    },
  });

const notificationExampleFields = {
  notificationId: 'ntf_789',
  to: 'usr_001',
  read: false,
  activityType: 'track_liked',
  actor: {
    userId: 'usr_001',
    displayName: 'Jane Smith',
    avatarUrl: 'https://cdn.example.com/avatars/usr_001.jpg',
  },
  target: {
    targetType: 'track',
    targetId: 'trk_456',
    title: 'My Awesome Track',
  },
  isBlockingActor: false,
  isFollowingActor: true,
  createdAt: '2025-01-15T12:00:00Z',
};

export const NotificationResponseDTO = extendedZod
  .object({
    notificationId: extendedZod.string(),
    to: extendedZod.string(),
    read: extendedZod.boolean(),
    activityType: extendedZod.enum([
      'track_liked',
      'track_commented',
      'user_mentioned',
      'track_reposted',
      'user_followed',
      'new_track',
    ]),
    actor: NotificationActorResponseDTO,
    target: NotificationTargetResponseDTO,
    isBlockingActor: extendedZod.boolean(),
    isFollowingActor: extendedZod.boolean(),
    createdAt: extendedZod.string().datetime(),
  })
  .openapi('NotificationResponse', {
    example: notificationExampleFields,
  });

export const NotificationTypeExamplesResponseDTO = extendedZod
  .object({
    like: NotificationResponseDTO,
    comment: NotificationResponseDTO,
    mention: NotificationResponseDTO,
    repost: NotificationResponseDTO,
    follow: NotificationResponseDTO,
    newTrack: NotificationResponseDTO,
  })
  .openapi('NotificationTypeExamplesResponse', {
    example: {
      like: {
        ...notificationExampleFields,
        notificationId: 'ntf_like_001',
        activityType: 'track_liked',
        actor: {
          userId: 'usr_010',
          displayName: 'Jane Smith',
          avatarUrl: 'https://cdn.example.com/avatars/usr_010.jpg',
        },
      },
      comment: {
        ...notificationExampleFields,
        notificationId: 'ntf_comment_001',
        activityType: 'track_commented',
        actor: {
          userId: 'usr_011',
          displayName: 'Ali Kareem',
        },
        target: {
          targetType: 'comment',
          targetId: 'cmt_123',
          trackId: 'trk_456',
          commentText: 'Great track!',
        },
      },
      mention: {
        ...notificationExampleFields,
        notificationId: 'ntf_mention_001',
        activityType: 'user_mentioned',
        actor: {
          userId: 'usr_020',
          displayName: 'Huda Beat',
        },
        target: {
          targetType: 'comment',
          targetId: 'cmt_988',
          trackId: 'trk_456',
          commentText: '@Jane check this part!',
          mentionedUserProfileLink: 'jane-smith-ab12c',
        },
      },
      repost: {
        ...notificationExampleFields,
        notificationId: 'ntf_repost_001',
        activityType: 'track_reposted',
        actor: {
          userId: 'usr_012',
          displayName: 'Maya Noor',
        },
      },
      follow: {
        ...notificationExampleFields,
        notificationId: 'ntf_follow_001',
        activityType: 'user_followed',
        actor: {
          userId: 'usr_013',
          displayName: 'Samir',
        },
        target: {
          targetType: 'user',
          targetId: 'usr_001',
        },
      },
      newTrack: {
        ...notificationExampleFields,
        notificationId: 'ntf_newtrack_001',
        activityType: 'new_track',
        actor: {
          userId: 'usr_014',
          displayName: 'Nora Wave',
        },
        target: {
          targetType: 'track',
          targetId: 'trk_999',
          title: 'Neon Drift',
        },
      },
    },
  });

export const NotificationListResponseDTO = extendedZod
  .object({
    total: extendedZod.number().int().min(0),
    offset: extendedZod.number().int().min(1),
    limit: extendedZod.number().int().min(1),
    notifications: extendedZod.array(NotificationResponseDTO),
  })
  .openapi('NotificationListResponse', {
    example: {
      total: 1,
      offset: 1,
      limit: 20,
      notifications: [notificationExampleFields],
    },
  });

export const UnreadCountResponseDTO = extendedZod
  .object({
    unreadCount: extendedZod.number().int().min(0),
  })
  .openapi('UnreadCountResponse', {
    example: {
      unreadCount: 5,
    },
  });

export const MarkReadResponseDTO = extendedZod
  .object({
    notificationId: extendedZod.string(),
    read: extendedZod.boolean(),
    unreadCount: extendedZod.number().int().min(0),
  })
  .openapi('MarkReadResponse', {
    example: {
      notificationId: 'ntf_789',
      read: true,
      unreadCount: 4,
    },
  });
