import User, { IUser } from '../../shared/models/models.user';
import BlockedList, {
  IBlockedList,
} from '../../shared/models/models.blocked-list';
import Conversation, {
  IConversation,
} from '../../shared/models/models.conversation';
import Message, { IMessage } from '../../shared/models/models.message';
import { Types } from 'mongoose';

export type IConversationParticipant = {
  _id: Types.ObjectId;
  displayName: string;
  profileImg: {
    imgLink: string;
    publicId: string;
  };
};

export type IConversationPopulated = {
  _id: Types.ObjectId;
  participants: IConversationParticipant[];
  isArchived: boolean;
  isReported: boolean;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export class MessagingRepository {
  async findUserById(userId: Types.ObjectId): Promise<IUser | null> {
    return await User.findById<IUser>(userId);
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

  async createNewChat(
    userId: Types.ObjectId,
    receiverId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated[] | null> {
    const newConversation = await Conversation.create({
      participants: [userId, receiverId],
      lastMessage: {
        senderId: userId,
        content: content,
      },
    });
    const newMessage = await Message.create({
      chatId: newConversation._id,
      senderId: userId,
      content: content,
    });
    return await this.getChatsHistory(userId);
  }

  async activateChat(
    userId: Types.ObjectId,
    chadId: Types.ObjectId,
    content: string,
  ): Promise<IConversationPopulated[] | null> {
    const updatedConversation = await Conversation.findOneAndUpdate(
      {
        _id: chadId,
      },
      {
        $set: {
          lastMessage: {
            senderId: userId,
            content,
            timestamp: new Date(),
          },
        },
      },
    );
    const newMessage = await Message.create({
      chatId: updatedConversation!._id,
      senderId: userId,
      content: content,
    });
    return await this.getChatsHistory(userId);
  }

  async getChatsHistory(
    userId: Types.ObjectId,
  ): Promise<IConversationPopulated[] | null> {
    return await Conversation.find({
      participants: userId,
      isArchived: false,
    })
      .populate('participants', 'displayName profileImg')
      .sort({ updatedAt: -1 })
      .lean<IConversationPopulated[]>();
  }

  async delete(id: string): Promise<boolean> {
    // TODO: delete from your data source
    return false;
  }
}
