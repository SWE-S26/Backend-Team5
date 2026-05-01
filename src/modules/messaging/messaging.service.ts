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
import {
  ChatMessagesResponseDTO,
  IConversationPopulated,
} from './dtos/messaging.response';
import { IConversation } from '../../shared/models/models.conversation';
import {
  getMessageNotifyhandler,
  MessageNotifyHandler,
} from '../../sockets/handlers/message.notify';
import { ISettings } from '../../shared/models/models.settings';
import { Type } from 'typescript';
import { IUser } from '../../shared/models/models.user';

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

  private async validateUserPrivacySettings(
    receiverSettings: ISettings | null,
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
  ) {
    const isAllowedMessageFromEveyOne =
      receiverSettings?.privacy.allowMessagesAnyone ?? false;
    if (isAllowedMessageFromEveyOne) {
      const receiverFollowing =
        await this.repository.findUserFollowedList(receiverId);
      if (!receiverFollowing) {
        throw ForbiddenError('User Privacy and settings');
      }
      if (!receiverFollowing.followed.some((f) => f.equals(userId))) {
        throw ForbiddenError('User Privacy and settings');
      }
    }
  }

  private async handleChatCreationOrReactivation(
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
    content: string,
  ) {
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
    return updatedChatsHistory;
  }

  async handleEmailSentToReceiver(
    receiverSettings: ISettings | null,
    userId: Types.ObjectId,
    receiver: IUser,
  ) {
    logger.info(
      `[message] : Email Service Status ${emailService.isEmailServiceWorking()}`,
    );
    const allowedEmailNotification =
      receiverSettings?.notifications?.newMessage.email ?? false;
    if (allowedEmailNotification) {
      const sender = await this.repository.findUserById(userId);
      emailService.sendNewMessageNotification(
        receiver.email,
        sender?.displayName as string,
        'https://beatza.me/message',
      );
      logger.info(
        `[message] : Email sent to receiver ${receiver.displayName} about new message ${userId}`,
      );
    }
  }

  async handlePushNotification(
    receiverSettings: ISettings | null,
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
    updatedChatHistory: IConversationPopulated,
  ) {
    try {
      let messageNotifyHandler = getMessageNotifyhandler();

      const messageNotifyType =
        receiverSettings?.notifications?.newMessage.devices;
      switch (messageNotifyType) {
        case 'off':
          logger.info('[message] : user has notify setting off');
          return;

        case 'followed':
          const receiverFollowing =
            await this.repository.findUserFollowedList(receiverId);
          if (!receiverFollowing) {
            throw ForbiddenError('User Privacy and settings');
          }
          if (!receiverFollowing.followed.some((f) => f.equals(userId))) {
            throw ForbiddenError('User Privacy and settings');
          }
          await messageNotifyHandler.sendMessageNotification(
            receiverId.toString(),
            updatedChatHistory,
          );
          return;

        case 'everyone':
          await messageNotifyHandler.sendMessageNotification(
            receiverId.toString(),
            updatedChatHistory,
          );
          return;
      }
    } catch (error) {
      logger.error('[message] : Message Notify not working');
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

    await this.validateUserPrivacySettings(
      receiverSettings,
      userId,
      receiverId,
    );
    const updatedChatHistory = await this.handleChatCreationOrReactivation(
      userId,
      receiverId,
      content,
    );
    await this.handleEmailSentToReceiver(
      receiverSettings,
      userId,
      receiver as IUser,
    );

    await this.handlePushNotification(
      receiverSettings,
      userId,
      receiverId,
      MessagingMapper.toChatHistoryReceiverResponse(updatedChatHistory, userId),
    );

    return MessagingMapper.toChatHistorySenderResponse(
      updatedChatHistory,
      userId,
    );
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

  async getChatsHistory(
    userId: Types.ObjectId,
    limit: number | undefined,
  ): Promise<any[] | null> {
    const chatsHistory = await this.repository.getChatsHistory(userId, limit);
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
    chat: IConversation,
    content: string,
  ) {
    const receiverId = chat.participants.find(
      (id) => id.toString() !== userId.toString(),
    );

    const [receiver, receiverBlockedList, receiverSettings] =
      await this.repository.findUserDetailedById(receiverId as Types.ObjectId);

    // validate Receiver Exists
    if (!receiver) {
      logger.warn('[message]: Invalid receiver ID is sent');
      return null;
    }

    // if receiver blocked this user can't send message to him
    if (receiverBlockedList?.blockedIds.includes(userId)) {
      logger.warn('[message]: Receiver is blocking user trying to send');
      return null;
    }

    const isAllowedMessageFromEveyOne =
      receiverSettings?.privacy.allowMessagesAnyone ?? false;
    if (isAllowedMessageFromEveyOne === false) {
      const receiverFollowing = await this.repository.findUserFollowedList(
        receiverId as Types.ObjectId,
      );
      if (!receiverFollowing) {
        return null;
      }
      if (!receiverFollowing.followed.some((f) => f.equals(userId))) {
        return null;
      }
    }

    const updatedConversation = await this.repository.sendMessage(
      userId,
      chat._id,
      content,
    );
    return {
      updatedConversation: MessagingMapper.toChatHistoryReceiverResponse(
        updatedConversation,
        userId,
      ),
      receiverSettings,
      receiver,
    };
  }

  async getUserSettings(userId: Types.ObjectId) {
    return await this.repository.getUserSettingsInfo(userId);
  }
}
