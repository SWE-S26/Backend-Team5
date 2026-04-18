import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { MessagingService } from './messaging.service';
import { JWTPayload } from '../../shared/abstractions/jwt.service';
import {
  SendNewMessageRequestDTO,
  ArchiveChatRequestDTO,
  GetChatMessagesRequestDTO,
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

  async getChatsHistory(req: Request, res: Response): Promise<void> {
    const userInfo = this.getUserInfo(req);
    const userId = new Types.ObjectId(userInfo.userId);
    const userChatsHistory = await this.service.getChatsHistory(userId);
    res.json({
      message: 'Chat History Retrieved Successfully',
      data: userChatsHistory,
    });
  }

  async getChatMessages(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(GetChatMessagesRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userInfo = this.getUserInfo(req);
    const userId = new Types.ObjectId(userInfo.userId);
    const paginationInfo = validatedRequest.data.query;
    const chatId = new Types.ObjectId(validatedRequest.data.params.id);
    const userChatMessages = await this.service.getChatMessages(
      userId,
      chatId,
      paginationInfo,
    );
    res.json({
      message: 'Chat Messages Retrieved Successfully',
      data: userChatMessages,
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
