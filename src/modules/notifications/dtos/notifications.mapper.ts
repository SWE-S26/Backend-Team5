import { NotificationRecord } from '../notifications.repository';

type NotificationActivityType =
  | 'track_liked'
  | 'track_commented'
  | 'track_reposted'
  | 'user_followed'
  | 'new_track';

type NotificationTargetType = 'track' | 'comment' | 'user';

export type NotificationResponseDTOType = {
  notificationId: string;
  to: string;
  read: boolean;
  activityType: NotificationActivityType;
  actor: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  };
  target: {
    targetType: NotificationTargetType;
    targetId: string;
    title?: string;
    trackId?: string;
    commentText?: string;
  };
  createdAt: string;
};

export class NotificationsMapper {
  static toResponse(entity: NotificationRecord): NotificationResponseDTOType {
    const activityType = this.toActivityType(entity.type.type);

    return {
      notificationId: entity._id.toString(),
      to: entity.to.toString(),
      read: entity.read,
      activityType,
      actor: {
        userId: entity.type.payload.actorId.toString(),
        displayName: entity.type.payload.actorName,
        avatarUrl: entity.type.payload.avatarURL,
      },
      target: this.toTarget(entity),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  static toListResponse(
    notifications: NotificationRecord[],
    offset: number,
    limit: number,
    total: number,
  ): {
    total: number;
    offset: number;
    limit: number;
    notifications: NotificationResponseDTOType[];
  } {
    return {
      total,
      offset,
      limit,
      notifications: notifications.map((notification) =>
        this.toResponse(notification),
      ),
    };
  }

  private static toActivityType(
    type: NotificationRecord['type']['type'],
  ): NotificationActivityType {
    switch (type) {
      case 'like':
        return 'track_liked';
      case 'comment':
        return 'track_commented';
      case 'repost':
        return 'track_reposted';
      case 'follow':
        return 'user_followed';
      case 'newTrack':
        return 'new_track';
      default:
        return 'track_liked';
    }
  }

  private static toTarget(
    entity: NotificationRecord,
  ): NotificationResponseDTOType['target'] {
    const referenceId = entity.type.referenceId.toString();
    const trackId = entity.type.payload.trackId?.toString();

    if (entity.type.type === 'follow') {
      return {
        targetType: 'user',
        targetId: referenceId,
      };
    }

    if (entity.type.type === 'comment') {
      return {
        targetType: 'comment',
        targetId: referenceId,
        trackId,
        commentText: entity.type.payload.commentText,
      };
    }

    return {
      targetType: 'track',
      targetId: trackId ?? referenceId,
      title: entity.type.payload.trackName,
    };
  }
}
