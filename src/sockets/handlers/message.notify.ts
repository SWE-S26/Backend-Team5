import { SocketService } from '../socket.service';
import { SocketEvents } from '../socket.events';
import { IConversationPopulated } from '../../modules/messaging/dtos/messaging.response';

export class MessageNotifyHandler {
  private readonly socketService: SocketService;
  constructor(socketService: SocketService) {
    this.socketService = socketService;
  }

  async sendMessageNotification(
    receiverId: string,
    sentMessage: any,
  ): Promise<void> {
    this.socketService.sendToUser(
      receiverId,
      SocketEvents.MSG_NOTIFY,
      sentMessage,
    );
  }
}

let messageNotifyHandler: MessageNotifyHandler | null = null;

export function initializeMessageNotifyHandler(
  socketService: SocketService,
): MessageNotifyHandler {
  messageNotifyHandler = new MessageNotifyHandler(socketService);
  return messageNotifyHandler;
}

export function getMessageNotifyhandler(): MessageNotifyHandler {
  if (!messageNotifyHandler) {
    throw new Error('Messafe Notify socket handler is not initialized');
  }

  return messageNotifyHandler;
}
