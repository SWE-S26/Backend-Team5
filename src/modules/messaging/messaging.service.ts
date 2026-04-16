import { MessagingRepository } from './messaging.repository';
import { CreateMessagingRequestDTO } from './dtos/messaging.request.body';
import {
  BadRequestError,
  ForbiddenError,
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
    newMessageDTO: CreateMessagingRequestDTO,
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

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
