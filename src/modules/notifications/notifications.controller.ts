import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { NotificationsService } from './notifications.service';
import {
  GetNotificationByIdRequestDTO,
  GetNotificationsRequestDTO,
} from './dtos/notifications.request';
import { NotificationsMapper } from './dtos/notifications.mapper';

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const result = await this.service.getUnreadCount(userId);
    res.json(result);
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const result = await this.service.markAllAsRead(userId);
    res.json(result);
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetNotificationByIdRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const userId = req.userInfo!._id;
    const { notificationId } = parsed.data.params;
    const result = await this.service.markAsRead(userId, notificationId);
    res.json(result);
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetNotificationsRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const userId = req.userInfo!._id;
    const { offset, limit, read } = parsed.data.query;

    const result = await this.service.getUserNotifications(userId, {
      offset,
      limit,
      read,
    });

    res.json(
      NotificationsMapper.toListResponse(
        result.notifications,
        result.offset,
        result.limit,
        result.total,
      ),
    );
  }

  async getNotificationById(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetNotificationByIdRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const userId = req.userInfo!._id;
    const { notificationId } = parsed.data.params;

    const notification = await this.service.getUserNotificationById(
      userId,
      notificationId,
    );

    res.json(NotificationsMapper.toResponse(notification));
  }
}
