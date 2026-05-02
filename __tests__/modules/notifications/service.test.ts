import { Types } from 'mongoose';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import {
  NotificationsRepository,
  NotificationRecord,
} from '../../../src/modules/notifications/notifications.repository';
import { ActorRelationStatus } from '../../../src/modules/notifications/dtos/notifications.mapper';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationsRepository>;

  const userId = '507f1f77bcf86cd799439011';
  const notificationId = '507f1f77bcf86cd799439099';
  const actorId = '507f1f77bcf86cd799439022';

  const fakeNotification: NotificationRecord = {
    _id: new Types.ObjectId(notificationId),
    to: new Types.ObjectId(userId),
    from: new Types.ObjectId(actorId),
    type: {
      type: 'like',
      referenceId: new Types.ObjectId(),
      payload: {
        actorName: 'Test Actor',
        actorId: new Types.ObjectId(actorId),
        avatarURL: 'https://cdn.example.com/avatar.jpg',
        trackName: 'Test Track',
        trackId: new Types.ObjectId(),
      },
    },
    read: false,
    createdAt: new Date('2025-01-15T12:00:00Z'),
  };

  beforeEach(() => {
    repo = {
      countForUser: jest.fn(),
      markAllAsReadForUser: jest.fn(),
      markAsReadForUser: jest.fn(),
      findForUser: jest.fn(),
      findByIdForUser: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createLikeNotification: jest.fn(),
      createCommentNotification: jest.fn(),
      createMentionNotification: jest.fn(),
      createRepostNotification: jest.fn(),
      createFollowNotification: jest.fn(),
      createNewTrackNotifications: jest.fn(),
      findBlockingActors: jest.fn(),
      findFollowedUserIds: jest.fn(),
      saveFcmToken: jest.fn(),
      removeFcmToken: jest.fn(),
      removeFcmTokensForUser: jest.fn(),
    } as any;

    service = new NotificationsService(repo);
    jest.clearAllMocks();
  });

  // =========================
  // getUnreadCount
  // =========================
  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      repo.countForUser.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(repo.countForUser).toHaveBeenCalledWith(userId, false);
      expect(result).toEqual({ unreadCount: 5 });
    });

    it('should throw when repository throws', async () => {
      repo.countForUser.mockRejectedValue(new Error('DB is down'));

      await expect(service.getUnreadCount(userId)).rejects.toThrow(
        'DB is down',
      );
    });
  });

  // =========================
  // markAllAsRead
  // =========================
  describe('markAllAsRead', () => {
    it('should mark all as read and return updated unread count', async () => {
      repo.markAllAsReadForUser.mockResolvedValue(3);
      repo.countForUser.mockResolvedValue(0);

      const result = await service.markAllAsRead(userId);

      expect(repo.markAllAsReadForUser).toHaveBeenCalledWith(userId);
      expect(repo.countForUser).toHaveBeenCalledWith(userId, false);
      expect(result).toEqual({ unreadCount: 0 });
    });

    it('should throw when repository throws', async () => {
      repo.markAllAsReadForUser.mockRejectedValue(new Error('DB is down'));

      await expect(service.markAllAsRead(userId)).rejects.toThrow('DB is down');
    });
  });

  // =========================
  // markAsRead
  // =========================
  describe('markAsRead', () => {
    it('should mark notification as read and return result', async () => {
      repo.markAsReadForUser.mockResolvedValue(fakeNotification);
      repo.countForUser.mockResolvedValue(4);

      const result = await service.markAsRead(userId, notificationId);

      expect(repo.markAsReadForUser).toHaveBeenCalledWith(
        userId,
        notificationId,
      );
      expect(repo.countForUser).toHaveBeenCalledWith(userId, false);
      expect(result).toEqual({
        notificationId,
        read: true,
        unreadCount: 4,
      });
    });

    it('should throw NotFoundError when notification not found', async () => {
      repo.markAsReadForUser.mockResolvedValue(null);

      await expect(service.markAsRead(userId, notificationId)).rejects.toThrow(
        'Notification not found',
      );
    });

    it('should not call countForUser when notification not found', async () => {
      repo.markAsReadForUser.mockResolvedValue(null);

      await expect(
        service.markAsRead(userId, notificationId),
      ).rejects.toThrow();

      expect(repo.countForUser).not.toHaveBeenCalled();
    });
  });

  // =========================
  // getUserNotifications
  // =========================
  describe('getUserNotifications', () => {
    it('should return notifications with actor relations', async () => {
      const notifications = [fakeNotification];
      repo.findForUser.mockResolvedValue(notifications);
      repo.countForUser.mockResolvedValue(1);
      repo.findBlockingActors.mockResolvedValue(new Set());
      repo.findFollowedUserIds.mockResolvedValue(new Set([actorId]));

      const result = await service.getUserNotifications(userId, {
        offset: 1,
        limit: 20,
      });

      expect(repo.findForUser).toHaveBeenCalledWith(userId, {
        offset: 1,
        limit: 20,
      });
      expect(repo.countForUser).toHaveBeenCalledWith(userId, undefined);
      expect(result.total).toBe(1);
      expect(result.offset).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.notifications).toEqual(notifications);
      expect(result.actorRelations.get(actorId)).toEqual({
        isBlockingActor: false,
        isFollowingActor: true,
      });
    });

    it('should pass read filter to repository', async () => {
      repo.findForUser.mockResolvedValue([]);
      repo.countForUser.mockResolvedValue(0);
      repo.findBlockingActors.mockResolvedValue(new Set());
      repo.findFollowedUserIds.mockResolvedValue(new Set());

      await service.getUserNotifications(userId, {
        offset: 1,
        limit: 20,
        read: false,
      });

      expect(repo.findForUser).toHaveBeenCalledWith(userId, {
        offset: 1,
        limit: 20,
        read: false,
      });
      expect(repo.countForUser).toHaveBeenCalledWith(userId, false);
    });

    it('should return empty actor relations when no notifications', async () => {
      repo.findForUser.mockResolvedValue([]);
      repo.countForUser.mockResolvedValue(0);

      const result = await service.getUserNotifications(userId, {
        offset: 1,
        limit: 20,
      });

      expect(result.actorRelations.size).toBe(0);
      expect(repo.findBlockingActors).not.toHaveBeenCalled();
      expect(repo.findFollowedUserIds).not.toHaveBeenCalled();
    });

    it('should use default offset and limit when not provided', async () => {
      repo.findForUser.mockResolvedValue([]);
      repo.countForUser.mockResolvedValue(0);

      const result = await service.getUserNotifications(userId, {});

      expect(result.offset).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should mark blocking actors correctly', async () => {
      const notifications = [fakeNotification];
      repo.findForUser.mockResolvedValue(notifications);
      repo.countForUser.mockResolvedValue(1);
      repo.findBlockingActors.mockResolvedValue(new Set([actorId]));
      repo.findFollowedUserIds.mockResolvedValue(new Set());

      const result = await service.getUserNotifications(userId, {
        offset: 1,
        limit: 20,
      });

      expect(result.actorRelations.get(actorId)).toEqual({
        isBlockingActor: true,
        isFollowingActor: false,
      });
    });
  });

  // =========================
  // getUserNotificationById
  // =========================
  describe('getUserNotificationById', () => {
    it('should return notification with actor relation', async () => {
      repo.findByIdForUser.mockResolvedValue(fakeNotification);
      repo.findBlockingActors.mockResolvedValue(new Set());
      repo.findFollowedUserIds.mockResolvedValue(new Set([actorId]));

      const result = await service.getUserNotificationById(
        userId,
        notificationId,
      );

      expect(repo.findByIdForUser).toHaveBeenCalledWith(userId, notificationId);
      expect(result.notification).toEqual(fakeNotification);
      expect(result.actorRelation).toEqual({
        isBlockingActor: false,
        isFollowingActor: true,
      });
    });

    it('should throw NotFoundError when notification not found', async () => {
      repo.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.getUserNotificationById(userId, notificationId),
      ).rejects.toThrow('Notification not found');
    });

    it('should not query actor relations when notification not found', async () => {
      repo.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.getUserNotificationById(userId, notificationId),
      ).rejects.toThrow();

      expect(repo.findBlockingActors).not.toHaveBeenCalled();
      expect(repo.findFollowedUserIds).not.toHaveBeenCalled();
    });
  });

  // =========================
  // Notification Creation Delegation
  // =========================
  describe('createLikeNotification', () => {
    it('should delegate to repository', async () => {
      repo.createLikeNotification.mockResolvedValue(fakeNotification);

      const result = await service.createLikeNotification(actorId, 'trackId');

      expect(repo.createLikeNotification).toHaveBeenCalledWith(
        actorId,
        'trackId',
      );
      expect(result).toEqual(fakeNotification);
    });

    it('should return null when repository returns null', async () => {
      repo.createLikeNotification.mockResolvedValue(null);

      const result = await service.createLikeNotification(actorId, 'trackId');

      expect(result).toBeNull();
    });
  });

  describe('createCommentNotification', () => {
    it('should delegate to repository', async () => {
      repo.createCommentNotification.mockResolvedValue(fakeNotification);

      const result = await service.createCommentNotification(
        actorId,
        'commentId',
      );

      expect(repo.createCommentNotification).toHaveBeenCalledWith(
        actorId,
        'commentId',
      );
      expect(result).toEqual(fakeNotification);
    });
  });

  describe('createMentionNotification', () => {
    it('should delegate to repository', async () => {
      repo.createMentionNotification.mockResolvedValue(fakeNotification);

      const result = await service.createMentionNotification(
        actorId,
        'commentId',
      );

      expect(repo.createMentionNotification).toHaveBeenCalledWith(
        actorId,
        'commentId',
      );
      expect(result).toEqual(fakeNotification);
    });
  });

  describe('createRepostNotification', () => {
    it('should delegate to repository', async () => {
      repo.createRepostNotification.mockResolvedValue(fakeNotification);

      const result = await service.createRepostNotification(actorId, 'trackId');

      expect(repo.createRepostNotification).toHaveBeenCalledWith(
        actorId,
        'trackId',
      );
      expect(result).toEqual(fakeNotification);
    });
  });

  describe('createFollowNotification', () => {
    it('should delegate to repository', async () => {
      repo.createFollowNotification.mockResolvedValue(fakeNotification);

      const result = await service.createFollowNotification(
        actorId,
        'followedUserId',
      );

      expect(repo.createFollowNotification).toHaveBeenCalledWith(
        actorId,
        'followedUserId',
      );
      expect(result).toEqual(fakeNotification);
    });
  });

  describe('createNewTrackNotifications', () => {
    it('should delegate to repository', async () => {
      repo.createNewTrackNotifications.mockResolvedValue([fakeNotification]);

      const result = await service.createNewTrackNotifications(
        actorId,
        'trackId',
      );

      expect(repo.createNewTrackNotifications).toHaveBeenCalledWith(
        actorId,
        'trackId',
      );
      expect(result).toEqual([fakeNotification]);
    });

    it('should return empty array when no followers', async () => {
      repo.createNewTrackNotifications.mockResolvedValue([]);

      const result = await service.createNewTrackNotifications(
        actorId,
        'trackId',
      );

      expect(result).toEqual([]);
    });
  });

  // =========================
  // FCM Token Methods
  // =========================
  describe('registerFcmToken', () => {
    it('should delegate to repository', async () => {
      repo.saveFcmToken.mockResolvedValue(undefined);

      await service.registerFcmToken(userId, 'fcm_token', 'android');

      expect(repo.saveFcmToken).toHaveBeenCalledWith(
        userId,
        'fcm_token',
        'android',
      );
    });
  });

  describe('unregisterFcmToken', () => {
    it('should delegate to repository and return result', async () => {
      repo.removeFcmToken.mockResolvedValue(true);

      const result = await service.unregisterFcmToken('fcm_token');

      expect(repo.removeFcmToken).toHaveBeenCalledWith('fcm_token');
      expect(result).toBe(true);
    });
  });

  describe('unregisterAllFcmTokens', () => {
    it('should delegate to repository and return deleted count', async () => {
      repo.removeFcmTokensForUser.mockResolvedValue(3);

      const result = await service.unregisterAllFcmTokens(userId);

      expect(repo.removeFcmTokensForUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(3);
    });
  });

  // =========================
  // Generic CRUD delegation
  // =========================
  describe('findAll', () => {
    it('should delegate to repository', async () => {
      repo.findAll.mockResolvedValue([fakeNotification] as any);

      const result = await service.findAll();

      expect(repo.findAll).toHaveBeenCalled();
      expect(result).toEqual([fakeNotification]);
    });
  });

  describe('findById', () => {
    it('should delegate to repository', async () => {
      repo.findById.mockResolvedValue(fakeNotification);

      const result = await service.findById(notificationId);

      expect(repo.findById).toHaveBeenCalledWith(notificationId);
      expect(result).toEqual(fakeNotification);
    });
  });

  describe('delete', () => {
    it('should delegate to repository', async () => {
      repo.delete.mockResolvedValue(true);

      const result = await service.delete(notificationId);

      expect(repo.delete).toHaveBeenCalledWith(notificationId);
      expect(result).toBe(true);
    });
  });
});
