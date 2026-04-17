import {
  NotificationRecord,
  NotificationsRepository,
} from './notifications.repository';
import { NotFoundError } from '../../shared/errors/responseErrors';

type ListNotificationsOptions = {
  offset?: number;
  limit?: number;
  read?: boolean;
};

export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

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
  }> {
    const offset = options.offset ?? 1;
    const limit = options.limit ?? 20;

    const [notifications, total] = await Promise.all([
      this.repository.findForUser(userId, options),
      this.repository.countForUser(userId, options.read),
    ]);

    return {
      total,
      offset,
      limit,
      notifications,
    };
  }

  async getUserNotificationById(
    userId: string,
    notificationId: string,
  ): Promise<NotificationRecord> {
    const notification = await this.repository.findByIdForUser(
      userId,
      notificationId,
    );

    if (!notification) {
      NotFoundError('Notification not found');
    }

    return notification as NotificationRecord;
  }

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
}
