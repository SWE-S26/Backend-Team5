import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { SocketService } from '../socket.service';
import { SocketEvents } from '../socket.events';
import logger from '../../shared/logger/logger';
import { MessagingService } from '../../modules/messaging/messaging.service';
import extendedZod from '../../shared/docs/dtoDocumenter';
import { IConversationPopulated } from '../../modules/messaging/dtos/messaging.response';

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
      socket.emit(SocketEvents.ERROR, { message: 'invalid schema sent' });
      logger.warn(`[${SocketEvents.JOIN_CHAT}]: Invalid Payload`);
      return;
    }

    const isValidatedIDs = validateIds(payload.chatId, socket.data.userId);
    if (!isValidatedIDs) {
      socket.emit(SocketEvents.ERROR, { message: 'invalid ids are sent' });
      return;
    }

    const userId = new Types.ObjectId(socket.data.userId);
    const chatId = new Types.ObjectId(payload.chatId);

    const searchChat = await validateChatAccessRules(
      chatId,
      userId,
      messageService,
    );
    if (!searchChat) {
      socket.emit(SocketEvents.ERROR, {
        message: "chat with this id doesn't exists",
      });
      return;
    }

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
      socket.emit(SocketEvents.ERROR, { message: 'invalid schema sent' });
      return;
    }

    const isValidatedIDs = validateIds(payload.chatId, socket.data.userId);
    if (!isValidatedIDs) {
      socket.emit(SocketEvents.ERROR, { message: 'invalid ids are sent' });
      return;
    }

    const userId = new Types.ObjectId(socket.data.userId);
    const chatId = new Types.ObjectId(payload.chatId);

    const searchChat = await validateChatAccessRules(
      chatId,
      userId,
      messageService,
    );
    if (!searchChat) {
      socket.emit(SocketEvents.ERROR, {
        message: "chat with this id doesn't exists",
      });
      return;
    }

    // remove user join room for this device
    socketService.removeFromUserChats(socket.data.userId, payload.chatId);

    // user leaves socket room
    socketService.leaveRoom(socket, payload.chatId);
    logger.info(
      `[${SocketEvents.LEAVE_CHAT}]: User ${userId} left chat with id ${payload.chatId}`,
    );
  });

  socket.on(SocketEvents.SEND_MSG, async (payload: any) => {
    try {
      const validatedPayload = MessagePayloadSchema.safeParse(payload);
      if (!validatedPayload.success) {
        logger.warn(`[${SocketEvents.SEND_MSG}]: Invalid Payload`);
        socket.emit(SocketEvents.ERROR, { message: 'invalid schema sent' });
        return;
      }

      const isValidatedIDs = validateIds(payload.chatId, socket.data.userId);
      if (!isValidatedIDs) {
        socket.emit(SocketEvents.ERROR, { message: 'invalid ids are sent' });
        logger.warn(`[${SocketEvents.SEND_MSG}]: Not Valid Ids`);
        return;
      }

      const userId = new Types.ObjectId(socket.data.userId);
      const chatId = new Types.ObjectId(payload.chatId);

      const searchChat = await validateChatAccessRules(
        chatId,
        userId,
        messageService,
      );
      if (!searchChat) {
        socket.emit(SocketEvents.ERROR, {
          message: "chat with this id doesn't exists",
        });
        return;
      }

      const result = await messageService.sendMessage(
        userId,
        searchChat,
        payload.content,
      );

      if (!result) {
        socket.emit(SocketEvents.ERROR, {
          message: 'Failed to send message due to privacy issues',
        });
        return;
      }

      const { updatedConversation, receiverSettings, receiver } = result;

      // send email to user
      await messageService.handleEmailSentToReceiver(
        receiverSettings,
        userId,
        receiver,
      );

      socket
        .to(chatId.toString())
        .emit(SocketEvents.SEND_MSG, updatedConversation);

      for (const receiverId of searchChat?.participants) {
        if (receiverId === userId) continue; // skip sender

        const isActive = socketService.isUserInChat(
          receiverId.toString(),
          payload.chatId,
        );

        if (!isActive) {
          messageService.handlePushNotification(
            receiverSettings,
            userId,
            receiverId,
            updatedConversation as IConversationPopulated,
          );
        }
      }
    } catch (err) {
      logger.error(err);
      socket.emit(SocketEvents.ERROR, { message: 'Something went wrong' });
    }
  });
}
