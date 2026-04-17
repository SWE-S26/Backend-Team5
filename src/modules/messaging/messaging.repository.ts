import User, { IUser } from '../../shared/models/models.user';
import BlockedList, {
  IBlockedList,
} from '../../shared/models/models.blocked-list';
import Conversation, {
  IConversation,
} from '../../shared/models/models.conversation';
import Message, { IMessage } from '../../shared/models/models.message';
import { Types } from 'mongoose';
import { IConversationPopulated } from './dtos/messaging.response';

export class MessagingRepository {
  async findUserById(userId: Types.ObjectId): Promise<IUser | null> {
    return await User.findById<IUser>(userId);
  }

  async findChatById(chatId: Types.ObjectId): Promise<IConversation | null> {
    return await Conversation.findById<IConversation>(chatId);
  }

  async findUserBlockedList(
    userId: Types.ObjectId,
  ): Promise<IBlockedList | null> {
    return await BlockedList.findOne({ blockerId: userId });
  }

  async findArchivedChat(
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
  ): Promise<any> {
    return await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });
  }

  async archiveChat(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
  ): Promise<any> {
    return await Conversation.findOneAndUpdate(
      { _id: chatId },
      {
        $addToSet: { archivedBy: userId },
      },
      { new: true },
    );
  }

  async createNewChat(
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated[] | null> {
    const newConversation = await Conversation.create({
      participants: [userId, receiverId],
    });
    const newMessage = await Message.create({
      chatId: newConversation._id,
      senderId: userId,
      content: content,
      seenBy: [userId],
    });

    await Conversation.findByIdAndUpdate(newConversation._id, {
      lastMessage: newMessage._id,
    });

    return await this.getChatsHistory(userId);
  }

  async activateChat(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated[] | null> {
    const newMessage = await Message.create({
      chatId: chatId,
      senderId: userId,
      content: content,
      seenBy: [userId],
    });
    const updatedConversation = await Conversation.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $set: {
          archivedBy: [],
          lastMessage: newMessage._id,
        },
      },
    );
    return await this.getChatsHistory(userId);
  }

  async getChatsHistory(
    userId: Types.ObjectId,
  ): Promise<IConversationPopulated[] | null> {
    return await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
    })
      .populate('participants', 'displayName profileImg')
      .populate('lastMessage', '_id content senderId createdAt seenBy')
      .sort({ updatedAt: -1 })
      .lean<IConversationPopulated[]>();
  }

  async delete(id: string): Promise<boolean> {
    // TODO: delete from your data source
    return false;
  }
}
