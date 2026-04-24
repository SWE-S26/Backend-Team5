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
import Settings, { ISettings } from '../../shared/models/models.settings';
import { PaginationInfo } from './dtos/messaging.request.query';
import Following, { IFollowing } from '../../shared/models/models.following';

export class MessagingRepository {
  async getUserSettingsInfo(userId: Types.ObjectId): Promise<ISettings | null> {
    return await Settings.findById<ISettings>({ userId: userId });
  }

  async findUserById(userId: Types.ObjectId): Promise<IUser | null> {
    return await User.findById<IUser>(userId);
  }

  async findUserDetailedById(
    userId: Types.ObjectId,
  ): Promise<[IUser | null, IBlockedList | null, ISettings | null]> {
    return await Promise.all([
      User.findById<IUser>(userId),
      BlockedList.findOne({ blockerId: userId }),
      Settings.findOne({ userId: userId }),
    ]);
  }

  async findUserBlockedList(
    userId: Types.ObjectId,
  ): Promise<IBlockedList | null> {
    return await BlockedList.findOne({ blockerId: userId });
  }

  async findChatById(chatId: Types.ObjectId): Promise<IConversation | null> {
    return await Conversation.findById<IConversation>(chatId);
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
      { returnDocument: 'after' },
    );
  }

  async createNewChat(
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated | null> {
    const newConversation = await Conversation.create({
      participants: [userId, receiverId],
    });
    const newMessage = await Message.create({
      chatId: newConversation._id,
      senderId: userId,
      content: content,
      seenBy: [userId],
    });

    const updatedConversation = await Conversation.findByIdAndUpdate(
      newConversation._id,
      {
        lastMessage: newMessage._id,
      },
      {
        new: true,
      },
    )
      .populate('participants', 'displayName profileImg')
      .populate('lastMessage', '_id content senderId createdAt seenBy')
      .lean<IConversationPopulated>();

    return updatedConversation;
  }

  async activateChat(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated | null> {
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
      { returnDocument: 'after' },
    )
      .populate('participants', 'displayName profileImg')
      .populate('lastMessage', '_id content senderId createdAt seenBy')
      .lean<IConversationPopulated>();
    return updatedConversation;
  }

  async getChatsHistory(
    userId: Types.ObjectId,
    limit: number | undefined,
  ): Promise<IConversationPopulated[] | null> {
    if (!limit) {
      return await Conversation.find({
        participants: userId,
        archivedBy: { $ne: userId },
      })
        .populate('participants', 'displayName profileImg')
        .populate('lastMessage', '_id content senderId createdAt seenBy')
        .sort({ updatedAt: -1 })
        .lean<IConversationPopulated[]>();
    } else {
      return await Conversation.find({
        participants: userId,
        archivedBy: { $ne: userId },
      })
        .limit(limit)
        .populate('participants', 'displayName profileImg')
        .populate('lastMessage', '_id content senderId createdAt seenBy')
        .sort({ updatedAt: -1 })
        .lean<IConversationPopulated[]>();
    }
  }

  async getChatMessages(
    chatId: Types.ObjectId,
    paginationInfo: PaginationInfo,
  ) {
    const before = paginationInfo.before;
    const limit = paginationInfo.limit;
    if (before) {
      return await Message.find<IMessage>({
        chatId,
        _id: { $lt: before },
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    } else {
      return await Message.find<IMessage>({ chatId: chatId })
        .sort({ createdAt: -1 })
        .limit(limit);
    }
  }

  async markAsRead(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
  ): Promise<void> {
    await Message.updateMany(
      {
        chatId,
        seenBy: { $ne: userId },
      },
      {
        $addToSet: { seenBy: userId },
      },
    );
  }

  async markAsUnRead(
    userId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<void> {
    await Message.updateMany(
      {
        _id: messageId,
      },
      {
        $pull: { seenBy: userId },
      },
    );
  }

  async sendMessage(
    userId: Types.ObjectId,
    chatId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated | null> {
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
          lastMessage: newMessage._id,
          archivedBy: [],
        },
      },
      { returnDocument: 'after' },
    )
      .populate('participants', 'displayName profileImg')
      .populate('lastMessage', '_id content senderId createdAt seenBy')
      .lean<IConversationPopulated>();
    return updatedConversation;
  }

  async findUserFollowedList(
    userId: Types.ObjectId,
  ): Promise<IFollowing | null> {
    return await Following.findOne<IFollowing>({ userId: userId });
  }
}
