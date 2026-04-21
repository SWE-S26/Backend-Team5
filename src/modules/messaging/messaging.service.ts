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
import { ChatMessagesResponseDTO } from './dtos/messaging.response';
import { IConversation } from '../../shared/models/models.conversation';
import {
  getMessageNotifyhandler,
  MessageNotifyHandler,
} from '../../sockets/handlers/message.notify';

export class MessagingService {
  private readonly repository: MessagingRepository;
  constructor() {
    this.repository = new MessagingRepository();
  }

  private validateChatExists(chat: IConversation | null) {
    if (!chat) {
      logger.warn('[message]: Invalid chat ID is sent');
      throw NotFoundError('Chat Not Found');
    }
  }

  private validateUserIsParticipantInChat(
    chat: IConversation,
    userId: Types.ObjectId,
  ) {
    if (!chat.participants.some((p) => p.equals(userId))) {
      logger.warn(`[message]: User ${userId} tried to join unauthorized chat`);
      throw ForbiddenError(
        'Cannot Delete A Chat User is not a participant in it',
      );
    }
  }

  async sendNewMessage(
    userId: Types.ObjectId,
    newMessageDTO: SendNewMessageDTO,
  ): Promise<any | null> {
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

    let messageNotifyHandler;
    try {
      messageNotifyHandler = getMessageNotifyhandler();
    } catch {
      logger.info('[message] : Message Notify not working');
    }

    return MessagingMapper.toChatHistoryResponse(updatedChatsHistory, userId);
  }

  async archiveChat(
    userId: Types.ObjectId,
    archiveChatDTO: ArchiveChatDTO,
  ): Promise<void> {
    const chatId = new Types.ObjectId(archiveChatDTO.chatId);
    const searchChat = await this.repository.findChatById(chatId);

    // check if chat exists
    this.validateChatExists(searchChat);

    // check if user is a participant of the chat
    this.validateUserIsParticipantInChat(searchChat as IConversation, userId);

    await this.repository.archiveChat(userId, chatId);
    logger.info(`[message]: chat ${chatId} is archived by user ${userId}`);
    return;
  }

  async getChatsHistory(userId: Types.ObjectId): Promise<any[] | null> {
    const chatsHistory = await this.repository.getChatsHistory(userId);
    logger.info(`[message]: fetched Chats history for user with id: ${userId}`);
    return MessagingMapper.toChatHistoryListResponse(chatsHistory, userId);
  }

  async getChatMessages(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
    paginationInfo: PaginationInfo,
  ): Promise<ChatMessagesResponseDTO | null> {
    const [searchChat, blocklist] = await Promise.all([
      this.repository.findChatById(chatId),
      this.repository.findUserBlockedList(userId),
    ]);

    // check if chat exists
    this.validateChatExists(searchChat);

    // check if user is a participant of the chat
    this.validateUserIsParticipantInChat(searchChat as IConversation, userId);

    // get receiver Id
    const receiverId = (searchChat as IConversation).participants.find((id) => {
      return id.toString() !== userId.toString();
    });

    // check if user blocked the receiver or not
    const isReceiverBlocked =
      blocklist?.blockedIds.some((p) => p.equals(receiverId)) ?? false;

    const chatMessages = await this.repository.getChatMessages(
      chatId,
      paginationInfo,
    );

    logger.info(
      `[message]: fetched messages of chat ${chatId} for user ${userId} - limit ${paginationInfo.limit} - before: ${paginationInfo.before}`,
    );
    return {
      messages: chatMessages,
      isReceiverBlocked,
    };
  }

  async markAsRead(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
  ): Promise<void> {
    const searchChat = await this.repository.findChatById(chatId);

    // check if chat exists
    this.validateChatExists(searchChat);

    // check if user is a participant of the chat
    this.validateUserIsParticipantInChat(searchChat as IConversation, userId);

    await this.repository.markAsRead(userId, chatId);
    logger.info(
      `[message]: All messages in chat ${chatId} is marked read by user ${userId}`,
    );
    return;
  }

  async markAsUnRead(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
  ): Promise<void> {
    const searchChat = await this.repository.findChatById(chatId);

    // check if chat exists
    this.validateChatExists(searchChat);

    // check if user is a participant of the chat
    this.validateUserIsParticipantInChat(searchChat as IConversation, userId);

    await this.repository.markAsUnRead(
      userId,
      (searchChat as IConversation).lastMessage._id,
    );
    logger.info(
      `[message]: last message in chat ${chatId} is marked unread by user ${userId}`,
    );
    return;
  }

  async findChatById(chatId: Types.ObjectId) {
    return await this.repository.findChatById(new Types.ObjectId(chatId));
  }

  async sendMessage(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
    content: string,
  ) {
    const updatedConversation = await this.repository.sendMessage(
      new Types.ObjectId(userId),
      new Types.ObjectId(chatId),
      content,
    );
    return MessagingMapper.toChatHistoryResponse(updatedConversation, userId);
  }
}
