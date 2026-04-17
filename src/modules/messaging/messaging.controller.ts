import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { MessagingService } from './messaging.service';
import { JWTPayload } from '../../shared/abstractions/jwt.service';
import {
  SendNewMessageRequestDTO,
  ArchiveChatRequestDTO,
} from './dtos/messaging.request';
import { Types } from 'mongoose';

type userInfo = {
  userId: string;
  userRole: string;
  paymentInfo: unknown;
};

export class MessagingController {
  private readonly service: MessagingService;

  constructor() {
    this.service = new MessagingService();
  }

  private getUserInfo(req: Request): userInfo {
    const { _id, role, paymentInfo } = req.userInfo! as JWTPayload;
    return {
      userId: _id,
      userRole: role,
      paymentInfo: paymentInfo,
    };
  }

  async sendNewMessage(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(SendNewMessageRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const newMessageDTO = validatedRequest.data.body;
    const userId = new Types.ObjectId(userInfo.userId);
    const updatedMessageHistory = await this.service.sendNewMessage(
      userId,
      newMessageDTO,
    );

    res.json({
      message: 'message sent sucessfully',
      data: updatedMessageHistory,
    });
  }

  async archiveChat(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(ArchiveChatRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const archiveChatDTO = validatedRequest.data.body;
    const userId = new Types.ObjectId(userInfo.userId);
    await this.service.archiveChat(userId, archiveChatDTO);
    res.json({
      message: 'Chat Archived Successfully',
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async replace(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async update(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async remove(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }
}
