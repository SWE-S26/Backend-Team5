import { Types } from 'mongoose';
import {
  NotificationRecord,
  NotificationsRepository,
} from '../../modules/notifications/notifications.repository';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import logger from '../../shared/logger/logger';
import Settings from '../../shared/models/models.settings';
import BlockedList from '../../shared/models/models.blocked-list';
import Following from '../../shared/models/models.following';
import { SocketEvents } from '../socket.events';
import { SocketService } from '../socket.service';

type NotificationActivityType =
  | 'track_liked'
  | 'track_commented'
  | 'user_mentioned'
  | 'track_reposted'
  | 'user_followed'
  | 'new_track';

type NotificationTargetType = 'track' | 'comment' | 'user';

type SettingsNotificationMode = 'email' | 'devices' | 'both' | 'off';
type DevicePreferenceField =
  | 'newFollower'
  | 'repostOfYourPost'
  | 'newPostByFollowedUser'
  | 'likesAndPlaysOnYourPost'
  | 'commentOnYourPost';

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
    mentionedUserProfileLink?: string;
  };
  isBlockingActor: boolean;
  isFollowingActor: boolean;
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
  ): Promise<NotificationReceivePayload | null> {
    const notification = await this.notificationsService.createLikeNotification(
      actorId,
      trackId,
    );
    if (!notification) return null;
    return this.emitNotification(notification);
  }

  async sendCommentNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationReceivePayload | null> {
    const notification =
      await this.notificationsService.createCommentNotification(
        actorId,
        commentId,
      );
    if (!notification) return null;
    return this.emitNotification(notification);
  }

  async sendMentionNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationReceivePayload | null> {
    const notification =
      await this.notificationsService.createMentionNotification(
        actorId,
        commentId,
      );
    if (!notification) return null;
    return this.emitNotification(notification);
  }

  async sendRepostNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationReceivePayload | null> {
    const notification =
      await this.notificationsService.createRepostNotification(
        actorId,
        trackId,
      );
    if (!notification) return null;
    return this.emitNotification(notification);
  }

  async sendFollowNotification(
    actorId: string,
    followedUserId: string,
  ): Promise<NotificationReceivePayload | null> {
    const notification =
      await this.notificationsService.createFollowNotification(
        actorId,
        followedUserId,
      );
    if (!notification) return null;
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

    return Promise.all(
      notifications.map((notification) => this.emitNotification(notification)),
    );
  }

  private async emitNotification(
    notification: NotificationRecord,
  ): Promise<NotificationReceivePayload> {
    const payload = this.toReceivePayload(notification);
    const shouldSend = await this.shouldSendToDevice(notification);

    const actorRelation = await this.getActorRelationStatus(
      notification.to,
      notification.type.payload.actorId,
    );

    const enrichedPayload: NotificationReceivePayload = {
      ...payload,
      isBlockingActor: actorRelation.isBlockingActor,
      isFollowingActor: actorRelation.isFollowingActor,
    };

    if (!shouldSend) {
      logger.info(
        `[notification:receive] recipient ${notification.to.toString()} disabled device notifications for ${payload.activityType}`,
      );
      return enrichedPayload;
    }

    const delivered = this.socketService.sendToUser(
      notification.to.toString(),
      SocketEvents.NOTIFICATION_RECEIVE,
      enrichedPayload,
    );

    if (!delivered) {
      logger.info(
        `[notification:receive] recipient ${notification.to.toString()} is offline for notification ${payload.notificationId}`,
      );
    }

    return enrichedPayload;
  }

  private async shouldSendToDevice(
    notification: NotificationRecord,
  ): Promise<boolean> {
    const preferenceField = this.toPreferenceField(notification.type.type);

    const settings = await Settings.findOne({
      userId: notification.to,
    })
      .select(`notifications.${preferenceField}`)
      .lean<{
        notifications?: Partial<
          Record<DevicePreferenceField, SettingsNotificationMode>
        >;
      } | null>();

    const preference = settings?.notifications?.[preferenceField] ?? 'devices';
    return preference === 'devices' || preference === 'both';
  }

  private async getActorRelationStatus(
    toUserId: Types.ObjectId,
    actorId: Types.ObjectId,
  ): Promise<{ isBlockingActor: boolean; isFollowingActor: boolean }> {
    const [blockedDoc, followingDoc] = await Promise.all([
      BlockedList.findOne({ blockerId: toUserId })
        .select('blockedIds')
        .lean<{ blockedIds?: Types.ObjectId[] } | null>(),
      Following.findOne({ userId: toUserId })
        .select('followed')
        .lean<{ followed?: Types.ObjectId[] } | null>(),
    ]);

    const isBlockingActor =
      blockedDoc?.blockedIds?.some((id) => id.equals(actorId)) ?? false;
    const isFollowingActor =
      followingDoc?.followed?.some((id) => id.equals(actorId)) ?? false;

    return { isBlockingActor, isFollowingActor };
  }

  private toPreferenceField(
    type: NotificationRecord['type']['type'],
  ): DevicePreferenceField {
    switch (type) {
      case 'like':
        return 'likesAndPlaysOnYourPost';
      case 'comment':
        return 'commentOnYourPost';
      case 'mention':
        return 'commentOnYourPost';
      case 'repost':
        return 'repostOfYourPost';
      case 'follow':
        return 'newFollower';
      case 'newTrack':
        return 'newPostByFollowedUser';
      default:
        return 'likesAndPlaysOnYourPost';
    }
  }

  private toReceivePayload(
    notification: NotificationRecord,
  ): Omit<NotificationReceivePayload, 'isBlockingActor' | 'isFollowingActor'> {
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
      case 'mention':
        return 'user_mentioned';
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

    if (
      notification.type.type === 'comment' ||
      notification.type.type === 'mention'
    ) {
      return {
        targetType: 'comment',
        targetId: referenceId,
        trackId: payloadTrackId,
        commentText: notification.type.payload.commentText,
        mentionedUserProfileLink:
          notification.type.payload.mentionedUserProfileLink,
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
