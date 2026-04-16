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

export class MessagingMapper {
  static toChatsHistoryResponse(
    chatsHistory: IConversationPopulated[] | null,
    userId: Types.ObjectId,
  ): any {
    if (!chatsHistory) return null;

    return chatsHistory
      .map((chat) => {
        const receiver = chat.participants.find(
          (p: any) => p._id.toString() !== userId.toString(),
        );

        if (!receiver) return null;

        return {
          _id: chat._id,
          lastMessage: chat.lastMessage,
          updatedAt: chat.updatedAt,
          receiver: {
            displayName: receiver.displayName,
            photoUrl: receiver.profileImg?.imgLink,
          },
        };
      })
      .filter(Boolean);
  }

  static toEntity(dto: any): any {
    // TODO: map request DTO fields to entity
    return {};
  }
}
