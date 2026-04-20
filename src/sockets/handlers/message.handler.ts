import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { SocketService } from '../socket.service';
import { SocketEvents } from '../socket.events';
import logger from '../../shared/logger/logger';
import { MessagingService } from '../../modules/messaging/messaging.service';
import { SendNewMessageDTO } from '../../modules/messaging/dtos/messaging.request.body';

interface ChatPayload {
  chatId: string;
}

interface MessagePayload {
  chatId: string;
  content: string;
}

export function RegisterMessageSocketHandlers(
  socket: Socket,
  socketService: SocketService,
  messageService: MessagingService,
) {
  socket.on(SocketEvents.JOIN_CHAT, async (payload: ChatPayload) => {
    const userId = socket.data.userId;
    const searchChat = await messageService.findChatById(payload.chatId);
    if (!searchChat) {
      logger.warn('Chat Not Found');
      return;
    }

    if (!searchChat.participants.includes(userId)) {
      logger.warn(`User ${userId} tried to join unauthorized chat`);
      return;
    }

    socketService.joinRoom(socket, payload.chatId);
    socketService.addToUserChats(socket.data.userId, payload.chatId);
    logger.info(
      `${SocketEvents.JOIN_CHAT} - user with id ${socket.data.userId} joined chat ${payload.chatId}`,
    );
  });

  socket.on(SocketEvents.LEAVE_CHAT, async (payload: ChatPayload) => {
    const userId = socket.data.userId;
    const searchChat = await messageService.findChatById(payload.chatId);
    if (!searchChat) {
      logger.warn('Chat Not Found');
      return;
    }

    if (!searchChat.participants.includes(userId)) {
      logger.warn(`User ${userId} tried to join unauthorized chat`);
      return;
    }
    socketService.removeFromUserChats(socket.data.userId, payload.chatId);
    socketService.leaveRoom(socket, payload.chatId);
    logger.info(`User ${userId} left chat with id ${payload.chatId}`);
  });

  socket.on(SocketEvents.SEND_MSG, async (payload: MessagePayload) => {
    const userId = socket.data.userId;
    const [message, chat] = await Promise.all([
      messageService.sendMessage(userId, payload.chatId, payload.content),
      messageService.findChatById(payload.chatId),
    ]);

    if (!chat) return;

    socket.to(payload.chatId).emit(SocketEvents.SEND_MSG, message);

    for (const participantId of chat?.participants) {
      if (participantId === userId) continue; // skip sender

      const isActive = socketService.isUserInChat(
        participantId.toString(),
        payload.chatId,
      );

      if (!isActive) {
        socketService.sendToUser(
          participantId.toString(),
          SocketEvents.MSG_NOTIFY,
          {
            message,
          },
        );
      }
    }
  });
}
