import { MessagingRepository } from './messaging.repository';
import {
  SendNewMessageDTO,
  ArchiveChatDTO,
} from './dtos/messaging.request.body';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { Types } from 'mongoose';
import { MessagingMapper } from './dtos/messaging.mapper';
import logger from '../../shared/logger/logger';
import emailService from '../../shared/abstractions/email/email.service';
import { PaginationInfo } from './dtos/messaging.request.query';

export class MessagingService {
  private readonly repository: MessagingRepository;
  constructor() {
    this.repository = new MessagingRepository();
  }

  async sendNewMessage(
    userId: Types.ObjectId,
    newMessageDTO: SendNewMessageDTO,
  ): Promise<any[] | null> {
    const receiverId = new Types.ObjectId(newMessageDTO.receiverId);
    const content = newMessageDTO.content;
    const [receiver, receiverBlockedList, receiverSettings] =
      await this.repository.findUserDetailedById(receiverId);

    // validate Receiver Exists
    if (!receiver) {
      logger.warn('[message]: Invalid receiver ID is sent');
      throw BadRequestError("Receiver ID doesn't exists");
    }

    // if receiver blocked this user can't send message to him
    if (receiverBlockedList?.blockedIds.includes(userId)) {
      logger.warn('[message]: Receiver is blocking user trying to send');
      throw ForbiddenError('User Blocked You Cannot Send to Him');
    }

    // search if chat exits with these two participents first
    const archivedChat = await this.repository.findArchivedChat(
      userId,
      receiverId,
    );

    let updatedChatsHistory = null;
    if (archivedChat) {
      logger.info('[message]: Activating archived chat');
      updatedChatsHistory = await this.repository.activateChat(
        userId,
        archivedChat._id,
        content,
      );
    } else {
      logger.info('[message]: Creating new chat');
      updatedChatsHistory = await this.repository.createNewChat(
        userId,
        receiverId,
        content,
      );
    }

    if (receiverSettings?.notifications?.newMessage.email) {
      const sender = await this.repository.findUserById(userId);
      emailService.sendNewMessageNotification(
        receiver.email,
        sender?.displayName as string,
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGexnRPTfFyGgeqSWNR1f279g3khX7QBVftQ&s',
      );
      logger.info('[message] : Email sent to receiver about new message');
    }

    return MessagingMapper.toChatsHistoryResponse(updatedChatsHistory, userId);
  }

  async archiveChat(
    userId: Types.ObjectId,
    archiveChatDTO: ArchiveChatDTO,
  ): Promise<void> {
    const chatId = new Types.ObjectId(archiveChatDTO.chatId);
    const searchChat = await this.repository.findChatById(chatId);

    // check if chat exists
    if (!searchChat) throw NotFoundError("A Chat With this ID Doesn't Exist");

    if (!searchChat.participants.some((p) => p.equals(userId)))
      throw ForbiddenError(
        'Cannot Delete A Chat User is not a participant in it',
      );

    await this.repository.archiveChat(userId, chatId);
    return;
  }

  async getChatsHistory(userId: Types.ObjectId): Promise<any[] | null> {
    const chatsHistory = await this.repository.getChatsHistory(userId);
    return MessagingMapper.toChatsHistoryResponse(chatsHistory, userId);
  }

  async getChatMessages(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
    paginationInfo: PaginationInfo,
  ): Promise<any[] | null> {
    const searchChat = await this.repository.findChatById(chatId);

    if (!searchChat) throw NotFoundError('Chat Not Found');

    if (!searchChat.participants.some((p) => p.equals(userId)))
      throw ForbiddenError('Forbbiden Access');

    const chatMessages = await this.repository.getChatMessages(
      chatId,
      paginationInfo,
    );

    return chatMessages;
  }

  async markAsRead(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
  ): Promise<void> {
    const searchChat = await this.repository.findChatById(chatId);

    if (!searchChat) throw NotFoundError("A Chat With this ID Doesn't Exist");

    if (!searchChat.participants.some((p) => p.equals(userId)))
      throw ForbiddenError(
        'Cannot Delete A Chat User is not a participant in it',
      );

    await this.repository.markAsRead(userId, chatId);
    return;
  }

  async markAsUnRead(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
  ): Promise<void> {
    const searchChat = await this.repository.findChatById(chatId);

    if (!searchChat) throw NotFoundError("A Chat With this ID Doesn't Exist");

    if (!searchChat.participants.some((p) => p.equals(userId)))
      throw ForbiddenError(
        'Cannot Delete A Chat User is not a participant in it',
      );

    await this.repository.markAsUnRead(userId, searchChat.lastMessage._id);
    return;
  }

  async findChatById(chatId: string) {
    return await this.repository.findChatById(new Types.ObjectId(chatId));
  }

  async sendMessage(userId: string, chatId: string, content: string) {
    const searchChat = await this.repository.findChatById(
      new Types.ObjectId(chatId),
    );

    if (!searchChat) throw NotFoundError('Chat Not Found');

    if (!searchChat.participants.some((p) => p.equals(userId)))
      throw ForbiddenError('Forbbiden Access');

    return await this.repository.sendMessage(
      new Types.ObjectId(userId),
      new Types.ObjectId(chatId),
      content,
    );
  }
}
