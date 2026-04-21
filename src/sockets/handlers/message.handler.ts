import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { SocketService } from '../socket.service';
import { SocketEvents } from '../socket.events';
import logger from '../../shared/logger/logger';
import { MessagingService } from '../../modules/messaging/messaging.service';
import extendedZod from '../../shared/docs/dtoDocumenter';

export const ChatPayloadSchema = extendedZod.object({
  chatId: extendedZod.string().min(1),
});

export const MessagePayloadSchema = extendedZod.object({
  chatId: extendedZod.string().min(1),
  content: extendedZod.string().min(1),
});

async function validateChatAccessRules(
  chatId: Types.ObjectId,
  userId: Types.ObjectId,
  messageService: MessagingService,
) {
  const searchChat = await messageService.findChatById(chatId);

  // check if chat exists
  if (!searchChat) {
    logger.warn('[sockets - message]: Chat Not Found');
    return null;
  }

  // check if user is a participant
  if (!searchChat.participants.includes(userId)) {
    logger.warn(
      `[sockets - message]: User ${userId} tried to join unauthorized chat`,
    );
    return null;
  }

  return searchChat;
}

function validateIds(chatId: string, userId: string) {
  if (!Types.ObjectId.isValid(chatId)) {
    logger.warn('[sockets - message]: Invalid chatId');
    return false;
  }

  if (!Types.ObjectId.isValid(userId)) {
    logger.warn('[sockets - message]: Invalid userId');
    return false;
  }

  return true;
}

export function RegisterMessageSocketHandlers(
  socket: Socket,
  socketService: SocketService,
  messageService: MessagingService,
) {
  socket.on(SocketEvents.JOIN_CHAT, async (payload: any) => {
    const validatedPayload = ChatPayloadSchema.safeParse(payload);
    if (!validatedPayload.success) {
      logger.warn(`[${SocketEvents.JOIN_CHAT}]: Invalid Payload`);
      return;
    }

    const isValidatedIDs = validateIds(payload.chatId, socket.data.userId);
    if (!isValidatedIDs) return;

    const userId = new Types.ObjectId(socket.data.userId);
    const chatId = new Types.ObjectId(payload.chatId);

    const searchChat = await validateChatAccessRules(
      chatId,
      userId,
      messageService,
    );
    if (!searchChat) return;

    // user joins socket room
    socketService.joinRoom(socket, payload.chatId);

    // store user join room for multiple device access
    socketService.addToUserChats(socket.data.userId, payload.chatId);

    logger.info(
      `[${SocketEvents.JOIN_CHAT}]: user with id ${socket.data.userId} joined chat ${payload.chatId}`,
    );
  });

  socket.on(SocketEvents.LEAVE_CHAT, async (payload: any) => {
    const validatedPayload = ChatPayloadSchema.safeParse(payload);
    if (!validatedPayload.success) {
      logger.warn(`[${SocketEvents.LEAVE_CHAT}]: Invalid Payload`);
      return;
    }

    const isValidatedIDs = validateIds(payload.chatId, socket.data.userId);
    if (!isValidatedIDs) return;

    const userId = new Types.ObjectId(socket.data.userId);
    const chatId = new Types.ObjectId(payload.chatId);

    const searchChat = await validateChatAccessRules(
      chatId,
      userId,
      messageService,
    );
    if (!searchChat) return;

    // remove user join room for this device
    socketService.removeFromUserChats(socket.data.userId, payload.chatId);

    // user leaves socket room
    socketService.leaveRoom(socket, payload.chatId);
    logger.info(
      `[${SocketEvents.LEAVE_CHAT}]: User ${userId} left chat with id ${payload.chatId}`,
    );
  });

  socket.on(SocketEvents.SEND_MSG, async (payload: any) => {
    const validatedPayload = MessagePayloadSchema.safeParse(payload);
    if (!validatedPayload.success) {
      logger.warn(`[${SocketEvents.SEND_MSG}]: Invalid Payload`);
      return;
    }

    const isValidatedIDs = validateIds(payload.chatId, socket.data.userId);
    if (!isValidatedIDs) return;

    const userId = new Types.ObjectId(socket.data.userId);
    const chatId = new Types.ObjectId(payload.chatId);

    const searchChat = await validateChatAccessRules(
      chatId,
      userId,
      messageService,
    );
    if (!searchChat) return;

    const sentMessage = await messageService.sendMessage(
      userId,
      chatId,
      payload.content,
    );

    socket.to(chatId.toString()).emit(SocketEvents.SEND_MSG, sentMessage);

    for (const participantId of searchChat?.participants) {
      if (participantId === userId) continue; // skip sender

      const isActive = socketService.isUserInChat(
        participantId.toString(),
        payload.chatId,
      );

      if (!isActive) {
        socketService.sendToUser(
          participantId.toString(),
          SocketEvents.MSG_NOTIFY,
          sentMessage,
        );
      }
    }
  });
}
