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

export class MessagingService {
  private readonly repository: MessagingRepository;
  constructor() {
    this.repository = new MessagingRepository();
  }

  async sendNewMessage(
    userId: Types.ObjectId,
    newMessageDTO: SendNewMessageDTO,
  ): Promise<any[] | null> {
    // validate Receiver Exists
    const receiverId = new Types.ObjectId(newMessageDTO.receiverId);
    const content = newMessageDTO.content;
    const receiver = await this.repository.findUserById(receiverId);

    if (!receiver) {
      throw BadRequestError("Receiver ID doesn't exists");
    }

    // validate user is not blocked
    const blockedList = await this.repository.findUserBlockedList(userId);

    if (blockedList?.blockedIds.includes(receiverId)) {
      throw ForbiddenError('User is Blocked Cannot Be Sent to');
    }

    // search if chat exits with these two participents first
    const archivedChat = await this.repository.findArchivedChat(
      userId,
      receiverId,
    );

    let updatedChatsHistory = null;
    if (archivedChat) {
      updatedChatsHistory = await this.repository.activateChat(
        userId,
        archivedChat._id,
        content,
      );
    } else {
      updatedChatsHistory = await this.repository.createNewChat(
        userId,
        receiverId,
        content,
      );
    }

    return MessagingMapper.toChatsHistoryResponse(updatedChatsHistory, userId);
  }

  async archiveChat(
    userId: Types.ObjectId,
    archiveChatDTO: ArchiveChatDTO,
  ): Promise<void> {
    // check if chat exists
    const chatId = new Types.ObjectId(archiveChatDTO.chatId);
    const searchChat = await this.repository.findChatById(chatId);

    if (!searchChat) throw NotFoundError("A Chat With this ID Doesn't Exist");

    if (!searchChat.participants.some((p) => p.equals(userId)))
      throw ForbiddenError(
        'Cannot Delete A Chat User is not a participant in it',
      );

    await this.repository.archiveChat(userId, chatId);
    return;
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
