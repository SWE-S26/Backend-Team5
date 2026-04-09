import { Types } from 'mongoose';
import {
  NotificationRecord,
  NotificationsRepository,
} from '../../modules/notifications/notifications.repository';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import logger from '../../shared/logger/logger';
import { SocketEvents } from '../socket.events';
import { SocketService } from '../socket.service';

type NotificationActivityType =
  | 'track_liked'
  | 'track_commented'
  | 'track_reposted'
  | 'user_followed'
  | 'new_track';

type NotificationTargetType = 'track' | 'comment' | 'user';

export type NotificationReceivePayload = {
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

export class NotificationSocketHandler {
  constructor(
    private readonly socketService: SocketService,
    private readonly notificationsService = new NotificationsService(
      new NotificationsRepository(),
    ),
  ) {}

  async sendLikeNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationReceivePayload> {
    const notification = await this.notificationsService.createLikeNotification(
      actorId,
      trackId,
    );
    return this.emitNotification(notification);
  }

  async sendCommentNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationReceivePayload> {
    const notification =
      await this.notificationsService.createCommentNotification(
        actorId,
        commentId,
      );
    return this.emitNotification(notification);
  }

  async sendRepostNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationReceivePayload> {
    const notification =
      await this.notificationsService.createRepostNotification(
        actorId,
        trackId,
      );
    return this.emitNotification(notification);
  }

  async sendFollowNotification(
    actorId: string,
    followedUserId: string,
  ): Promise<NotificationReceivePayload> {
    const notification =
      await this.notificationsService.createFollowNotification(
        actorId,
        followedUserId,
      );
    return this.emitNotification(notification);
  }

  async sendNewTrackNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationReceivePayload[]> {
    const notifications =
      await this.notificationsService.createNewTrackNotifications(
        actorId,
        trackId,
      );

    return notifications.map((notification) =>
      this.emitNotification(notification),
    );
  }

  private emitNotification(
    notification: NotificationRecord,
  ): NotificationReceivePayload {
    const payload = this.toReceivePayload(notification);

    const delivered = this.socketService.sendToUser(
      notification.to.toString(),
      SocketEvents.NOTIFICATION_RECEIVE,
      payload,
    );

    if (!delivered) {
      logger.info(
        `[notification:receive] recipient ${notification.to.toString()} is offline for notification ${payload.notificationId}`,
      );
    }

    return payload;
  }

  private toReceivePayload(
    notification: NotificationRecord,
  ): NotificationReceivePayload {
    const activityType = this.toActivityType(notification.type.type);

    return {
      notificationId: notification._id.toString(),
      to: notification.to.toString(),
      read: notification.read,
      activityType,
      actor: {
        userId: notification.type.payload.actorId.toString(),
        displayName: notification.type.payload.actorName,
        avatarUrl: notification.type.payload.avatarURL,
      },
      target: this.toTarget(notification),
      createdAt: notification.createdAt.toISOString(),
    };
  }

  private toActivityType(
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

  private toTarget(
    notification: NotificationRecord,
  ): NotificationReceivePayload['target'] {
    const referenceId = notification.type.referenceId.toString();
    const payloadTrackId = this.toOptionalObjectIdString(
      notification.type.payload.trackId,
    );

    if (notification.type.type === 'follow') {
      return {
        targetType: 'user',
        targetId: referenceId,
      };
    }

    if (notification.type.type === 'comment') {
      return {
        targetType: 'comment',
        targetId: referenceId,
        trackId: payloadTrackId,
        commentText: notification.type.payload.commentText,
      };
    }

    return {
      targetType: 'track',
      targetId: payloadTrackId ?? referenceId,
      title: notification.type.payload.trackName,
    };
  }

  private toOptionalObjectIdString(value?: Types.ObjectId): string | undefined {
    if (!value) return undefined;
    return value.toString();
  }
}

let notificationSocketHandler: NotificationSocketHandler | null = null;

export function initializeNotificationSocketHandler(
  socketService: SocketService,
): NotificationSocketHandler {
  notificationSocketHandler = new NotificationSocketHandler(socketService);
  return notificationSocketHandler;
}

export function getNotificationSocketHandler(): NotificationSocketHandler {
  if (!notificationSocketHandler) {
    throw new Error('Notification socket handler is not initialized');
  }

  return notificationSocketHandler;
}
