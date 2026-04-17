import extendedZod from '../../../shared/docs/dtoDocumenter';
import { Types } from 'mongoose';

export const MessagingResponseDto = extendedZod
  .object({
    id: extendedZod.string(),
    email: extendedZod.string(),
    name: extendedZod.string(),
    role: extendedZod.enum(['user', 'admin']),
  })
  .openapi('MessagingResponse', {
    example: {
      id: '697b7c75001e8cb1d4c0bb67',
      email: 'user@example.com',
      name: 'cow',
      role: 'user',
    },
  });

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
  archivedBy: Types.ObjectId[];
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};
