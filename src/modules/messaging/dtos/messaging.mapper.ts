import { Types } from 'mongoose';
import { IConversationPopulated } from './messaging.response';

export class MessagingMapper {
  static toChatHistorySenderResponse(
    chat: IConversationPopulated | null,
    userId: Types.ObjectId,
  ): any {
    if (!chat) return null;

    const receiver = chat.participants.find(
      (p: any) => p._id.toString() !== userId.toString(),
    );

    if (!receiver) return null;

    return {
      _id: chat._id,
      lastMessage: chat.lastMessage,
      receiver: {
        displayName: receiver.displayName,
        photoUrl: receiver.profileImg?.imgLink,
      },
    };
  }

  static toChatHistoryReceiverResponse(
    chat: IConversationPopulated | null,
    userId: Types.ObjectId,
  ): any {
    if (!chat) return null;

    const sender = chat.participants.find(
      (p: any) => p._id.toString() == userId.toString(),
    );

    if (!sender) return null;

    return {
      _id: chat._id,
      lastMessage: chat.lastMessage,
      receiver: {
        displayName: sender.displayName,
        photoUrl: sender.profileImg?.imgLink,
      },
    };
  }

  static toChatHistoryListResponse(
    chatsHistory: IConversationPopulated[] | null,
    userId: Types.ObjectId,
  ): any {
    if (!chatsHistory) return null;
    const chatsMapped: any[] = [];
    chatsHistory.forEach((chat) => {
      const chatMapped = this.toChatHistorySenderResponse(chat, userId);
      if (chatMapped !== null) chatsMapped.push(chatMapped);
    });
    return chatsMapped;
  }
}
