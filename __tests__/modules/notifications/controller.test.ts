import { Request, Response } from 'express';
import { NotificationsController } from '../../../src/modules/notifications/notifications.controller';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import {
  NotificationsMapper,
  ActorRelationStatus,
} from '../../../src/modules/notifications/dtos/notifications.mapper';
import { parseRequest } from '../../../src/shared/dtos/requestParser';
import { NotificationRecord } from '../../../src/modules/notifications/notifications.repository';
import { Types } from 'mongoose';

jest.mock('../../../src/shared/dtos/requestParser');
jest.mock('../../../src/modules/notifications/notifications.service');
jest.mock('../../../src/modules/notifications/dtos/notifications.mapper');
jest.mock('../../../src/modules/payment/payment.controller');

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = new NotificationsService(
      {} as any,
    ) as jest.Mocked<NotificationsService>;
    controller = new NotificationsController(service);

    req = {
      userInfo: { _id: '507f1f77bcf86cd799439011' } as any,
      params: {},
      body: {},
      query: {},
    } as unknown as Request;

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const mockValid = (data: any) => {
    (parseRequest as jest.Mock).mockReturnValue({ success: true, data });
  };

  const mockInvalid = (error = new Error('invalid')) => {
    (parseRequest as jest.Mock).mockReturnValue({ success: false, error });
  };

  const fakeActorRelation: ActorRelationStatus = {
    isBlockingActor: false,
    isFollowingActor: true,
  };

  const fakeNotificationDTO = {
    notificationId: '507f1f77bcf86cd799439099',
    to: '507f1f77bcf86cd799439011',
    read: false,
    activityType: 'track_liked' as const,
    actor: { userId: 'actor1', displayName: 'Actor' },
    target: {
      targetType: 'track' as const,
      targetId: 'track1',
      title: 'Track',
    },
    isBlockingActor: false,
    isFollowingActor: true,
    createdAt: '2025-01-15T12:00:00Z',
  };

  // =========================
  // getUnreadCount
  // =========================
  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      service.getUnreadCount.mockResolvedValue({ unreadCount: 5 });

      await controller.getUnreadCount(req as Request, res as Response);

      expect(service.getUnreadCount).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(res.json).toHaveBeenCalledWith({ unreadCount: 5 });
    });

    it('should throw when service throws', async () => {
      service.getUnreadCount.mockRejectedValue(new Error('DB is down'));

      await expect(
        controller.getUnreadCount(req as Request, res as Response),
      ).rejects.toThrow('DB is down');
    });
  });

  // =========================
  // markAllAsRead
  // =========================
  describe('markAllAsRead', () => {
    it('should mark all as read and return unread count', async () => {
      service.markAllAsRead.mockResolvedValue({ unreadCount: 0 });

      await controller.markAllAsRead(req as Request, res as Response);

      expect(service.markAllAsRead).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(res.json).toHaveBeenCalledWith({ unreadCount: 0 });
    });

    it('should throw when service throws', async () => {
      service.markAllAsRead.mockRejectedValue(new Error('DB is down'));

      await expect(
        controller.markAllAsRead(req as Request, res as Response),
      ).rejects.toThrow('DB is down');
    });
  });

  // =========================
  // markAsRead
  // =========================
  describe('markAsRead', () => {
    it('should mark notification as read and return result', async () => {
      req.params = { notificationId: '507f1f77bcf86cd799439099' };
      mockValid({ params: { notificationId: '507f1f77bcf86cd799439099' } });

      service.markAsRead.mockResolvedValue({
        notificationId: '507f1f77bcf86cd799439099',
        read: true,
        unreadCount: 4,
      });

      await controller.markAsRead(req as Request, res as Response);

      expect(service.markAsRead).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439099',
      );
      expect(res.json).toHaveBeenCalledWith({
        notificationId: '507f1f77bcf86cd799439099',
        read: true,
        unreadCount: 4,
      });
    });

    it('should throw when request validation fails', async () => {
      mockInvalid(new Error('bad request'));

      await expect(
        controller.markAsRead(req as Request, res as Response),
      ).rejects.toThrow('bad request');
    });

    it('should throw when service throws', async () => {
      req.params = { notificationId: '507f1f77bcf86cd799439099' };
      mockValid({ params: { notificationId: '507f1f77bcf86cd799439099' } });

      service.markAsRead.mockRejectedValue(new Error('Notification not found'));

      await expect(
        controller.markAsRead(req as Request, res as Response),
      ).rejects.toThrow('Notification not found');
    });
  });

  // =========================
  // getNotifications
  // =========================
  describe('getNotifications', () => {
    it('should return mapped notification list', async () => {
      mockValid({ query: { offset: 1, limit: 20 } });

      const fakeNotifications: NotificationRecord[] = [];
      const fakeActorRelations = new Map<string, ActorRelationStatus>();

      service.getUserNotifications.mockResolvedValue({
        total: 0,
        offset: 1,
        limit: 20,
        notifications: fakeNotifications,
        actorRelations: fakeActorRelations,
      });

      (NotificationsMapper.toListResponse as jest.Mock).mockReturnValue({
        total: 0,
        offset: 1,
        limit: 20,
        notifications: [],
      });

      await controller.getNotifications(req as Request, res as Response);

      expect(service.getUserNotifications).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { offset: 1, limit: 20, read: undefined },
      );
      expect(NotificationsMapper.toListResponse).toHaveBeenCalledWith(
        fakeNotifications,
        1,
        20,
        0,
        fakeActorRelations,
      );
      expect(res.json).toHaveBeenCalledWith({
        total: 0,
        offset: 1,
        limit: 20,
        notifications: [],
      });
    });

    it('should pass read filter to service', async () => {
      mockValid({ query: { offset: 1, limit: 20, read: false } });

      service.getUserNotifications.mockResolvedValue({
        total: 0,
        offset: 1,
        limit: 20,
        notifications: [],
        actorRelations: new Map(),
      });

      (NotificationsMapper.toListResponse as jest.Mock).mockReturnValue({
        total: 0,
        offset: 1,
        limit: 20,
        notifications: [],
      });

      await controller.getNotifications(req as Request, res as Response);

      expect(service.getUserNotifications).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { offset: 1, limit: 20, read: false },
      );
    });

    it('should throw when request validation fails', async () => {
      mockInvalid(new Error('bad request'));

      await expect(
        controller.getNotifications(req as Request, res as Response),
      ).rejects.toThrow('bad request');
    });

    it('should throw when service throws', async () => {
      mockValid({ query: { offset: 1, limit: 20 } });

      service.getUserNotifications.mockRejectedValue(new Error('DB is down'));

      await expect(
        controller.getNotifications(req as Request, res as Response),
      ).rejects.toThrow('DB is down');
    });
  });

  // =========================
  // getNotificationById
  // =========================
  describe('getNotificationById', () => {
    it('should return mapped notification', async () => {
      req.params = { notificationId: '507f1f77bcf86cd799439099' };
      mockValid({ params: { notificationId: '507f1f77bcf86cd799439099' } });

      const fakeNotification = {} as NotificationRecord;

      service.getUserNotificationById.mockResolvedValue({
        notification: fakeNotification,
        actorRelation: fakeActorRelation,
      });

      (NotificationsMapper.toResponse as jest.Mock).mockReturnValue(
        fakeNotificationDTO,
      );

      await controller.getNotificationById(req as Request, res as Response);

      expect(service.getUserNotificationById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439099',
      );
      expect(NotificationsMapper.toResponse).toHaveBeenCalledWith(
        fakeNotification,
        fakeActorRelation,
      );
      expect(res.json).toHaveBeenCalledWith(fakeNotificationDTO);
    });

    it('should throw when request validation fails', async () => {
      mockInvalid(new Error('bad request'));

      await expect(
        controller.getNotificationById(req as Request, res as Response),
      ).rejects.toThrow('bad request');
    });

    it('should throw when service throws', async () => {
      req.params = { notificationId: '507f1f77bcf86cd799439099' };
      mockValid({ params: { notificationId: '507f1f77bcf86cd799439099' } });

      service.getUserNotificationById.mockRejectedValue(
        new Error('Notification not found'),
      );

      await expect(
        controller.getNotificationById(req as Request, res as Response),
      ).rejects.toThrow('Notification not found');
    });
  });

  // =========================
  // registerFcmToken
  // =========================
  describe('registerFcmToken', () => {
    it('should register FCM token and return success message', async () => {
      mockValid({ body: { token: 'fcm_token_123', platform: 'android' } });

      service.registerFcmToken.mockResolvedValue(undefined);

      await controller.registerFcmToken(req as Request, res as Response);

      expect(service.registerFcmToken).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'fcm_token_123',
        'android',
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'FCM token registered successfully',
      });
    });

    it('should throw when request validation fails', async () => {
      mockInvalid(new Error('bad request'));

      await expect(
        controller.registerFcmToken(req as Request, res as Response),
      ).rejects.toThrow('bad request');
    });

    it('should throw when service throws', async () => {
      mockValid({ body: { token: 'fcm_token_123', platform: 'ios' } });

      service.registerFcmToken.mockRejectedValue(new Error('DB is down'));

      await expect(
        controller.registerFcmToken(req as Request, res as Response),
      ).rejects.toThrow('DB is down');
    });
  });

  // =========================
  // unregisterFcmToken
  // =========================
  describe('unregisterFcmToken', () => {
    it('should unregister FCM token and return success message', async () => {
      mockValid({ body: { token: 'fcm_token_123' } });

      service.unregisterFcmToken.mockResolvedValue(true);

      await controller.unregisterFcmToken(req as Request, res as Response);

      expect(service.unregisterFcmToken).toHaveBeenCalledWith('fcm_token_123');
      expect(res.json).toHaveBeenCalledWith({
        message: 'FCM token unregistered successfully',
      });
    });

    it('should throw when request validation fails', async () => {
      mockInvalid(new Error('bad request'));

      await expect(
        controller.unregisterFcmToken(req as Request, res as Response),
      ).rejects.toThrow('bad request');
    });

    it('should throw when service throws', async () => {
      mockValid({ body: { token: 'fcm_token_123' } });

      service.unregisterFcmToken.mockRejectedValue(new Error('DB is down'));

      await expect(
        controller.unregisterFcmToken(req as Request, res as Response),
      ).rejects.toThrow('DB is down');
    });
  });
});
