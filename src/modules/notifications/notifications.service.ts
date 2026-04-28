import { Types } from 'mongoose';
import {
  NotificationRecord,
  NotificationsRepository,
} from './notifications.repository';
import { NotFoundError } from '../../shared/errors/responseErrors';
import { ActorRelationStatus } from './dtos/notifications.mapper';

type ListNotificationsOptions = {
  offset?: number;
  limit?: number;
  read?: boolean;
};

export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  // ─── Notification Queries ─────────────────────────────────────────

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.repository.countForUser(userId, false);
    return { unreadCount };
  }

  async markAllAsRead(userId: string): Promise<{ unreadCount: number }> {
    await this.repository.markAllAsReadForUser(userId);
    const unreadCount = await this.repository.countForUser(userId, false);
    return { unreadCount };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<{
    notificationId: string;
    read: boolean;
    unreadCount: number;
  }> {
    const updated = await this.repository.markAsReadForUser(
      userId,
      notificationId,
    );

    if (!updated) {
      NotFoundError('Notification not found');
    }

    const unreadCount = await this.repository.countForUser(userId, false);

    return {
      notificationId: notificationId,
      read: true,
      unreadCount,
    };
  }

  async getUserNotifications(
    userId: string,
    options: ListNotificationsOptions,
  ): Promise<{
    total: number;
    offset: number;
    limit: number;
    notifications: NotificationRecord[];
    actorRelations: Map<string, ActorRelationStatus>;
  }> {
    const offset = options.offset ?? 1;
    const limit = options.limit ?? 20;

    const [notifications, total] = await Promise.all([
      this.repository.findForUser(userId, options),
      this.repository.countForUser(userId, options.read),
    ]);

    const actorRelations = await this.getActorRelationsBatch(
      userId,
      notifications,
    );

    return {
      total,
      offset,
      limit,
      notifications,
      actorRelations,
    };
  }

  async getUserNotificationById(
    userId: string,
    notificationId: string,
  ): Promise<{
    notification: NotificationRecord;
    actorRelation: ActorRelationStatus;
  }> {
    const notification = await this.repository.findByIdForUser(
      userId,
      notificationId,
    );

    if (!notification) {
      NotFoundError('Notification not found');
    }

    const notif = notification as NotificationRecord;
    const actorRelation = await this.getActorRelation(
      userId,
      notif.type.payload.actorId.toString(),
    );

    return {
      notification: notif,
      actorRelation,
    };
  }

  // ─── Notification Creation ────────────────────────────────────────

  async findAll(): Promise<any[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async create(data: any): Promise<any> {
    return this.repository.create(data);
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async createLikeNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationRecord | null> {
    return this.repository.createLikeNotification(actorId, trackId);
  }

  async createCommentNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationRecord | null> {
    return this.repository.createCommentNotification(actorId, commentId);
  }

  async createMentionNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationRecord | null> {
    return this.repository.createMentionNotification(actorId, commentId);
  }

  async createRepostNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationRecord | null> {
    return this.repository.createRepostNotification(actorId, trackId);
  }

  async createFollowNotification(
    actorId: string,
    followedUserId: string,
  ): Promise<NotificationRecord | null> {
    return this.repository.createFollowNotification(actorId, followedUserId);
  }

  async createNewTrackNotifications(
    actorId: string,
    trackId: string,
  ): Promise<NotificationRecord[]> {
    return this.repository.createNewTrackNotifications(actorId, trackId);
  }

  // ─── FCM Token Methods ────────────────────────────────────────────

  async registerFcmToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    await this.repository.saveFcmToken(userId, token, platform);
  }

  async unregisterFcmToken(token: string): Promise<boolean> {
    return this.repository.removeFcmToken(token);
  }

  async unregisterAllFcmTokens(userId: string): Promise<number> {
    return this.repository.removeFcmTokensForUser(userId);
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private async getActorRelationsBatch(
    recipientId: string,
    notifications: NotificationRecord[],
  ): Promise<Map<string, ActorRelationStatus>> {
    const uniqueActorIds = [
      ...new Set(notifications.map((n) => n.type.payload.actorId.toString())),
    ];

    if (uniqueActorIds.length === 0) {
      return new Map();
    }

    const actorObjectIds = uniqueActorIds.map((id) => new Types.ObjectId(id));
    const recipientObjectId = new Types.ObjectId(recipientId);

    const [blockingActors, followedUserIds] = await Promise.all([
      this.repository.findBlockingActors(actorObjectIds, recipientObjectId),
      this.repository.findFollowedUserIds(recipientObjectId),
    ]);

    const relations = new Map<string, ActorRelationStatus>();
    for (const actorId of uniqueActorIds) {
      relations.set(actorId, {
        isBlockingActor: blockingActors.has(actorId),
        isFollowingActor: followedUserIds.has(actorId),
      });
    }
    return relations;
  }

  private async getActorRelation(
    recipientId: string,
    actorId: string,
  ): Promise<ActorRelationStatus> {
    const [blockingActors, followedUserIds] = await Promise.all([
      this.repository.findBlockingActors(
        [new Types.ObjectId(actorId)],
        new Types.ObjectId(recipientId),
      ),
      this.repository.findFollowedUserIds(new Types.ObjectId(recipientId)),
    ]);

    return {
      isBlockingActor: blockingActors.has(actorId),
      isFollowingActor: followedUserIds.has(actorId),
    };
  }
}
