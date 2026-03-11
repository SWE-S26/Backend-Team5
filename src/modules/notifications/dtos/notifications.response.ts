import extendedZod from '../../../shared/docs/dtoDocumenter';

export const NotificationResponseDTO = extendedZod
  .object({
    notificationId: extendedZod.string(),
    to: extendedZod.string(),
    read: extendedZod.boolean(),
    activityType: extendedZod.enum([
      'track_liked',
      'track_reposted',
      'new_follower',
      'new_comment',
      'comment_liked',
      'comment_reply',
    ]),
    createdAt: extendedZod.string().datetime(),
  })
  .openapi('NotificationResponse', {
    example: {
      notificationId: 'ntf_789',
      to: 'usr_001',
      read: false,
      activityType: 'track_liked',
      createdAt: '2025-01-15T12:00:00Z',
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
