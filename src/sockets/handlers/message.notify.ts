import { SocketService } from '../socket.service';
import { SocketEvents } from '../socket.events';
import { FcmService } from '../../shared/abstractions/fcm/fcm.service';

export class MessageNotifyHandler {
  private readonly socketService: SocketService;
  private readonly fcmService: FcmService;
  constructor(socketService: SocketService, fcmService: FcmService) {
    this.socketService = socketService;
    this.fcmService = fcmService;
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

    await this.fcmService.sendMessageNotificationToUser(
      receiverId,
      sentMessage,
    );
  }
}

let messageNotifyHandler: MessageNotifyHandler | null = null;

export function initializeMessageNotifyHandler(
  socketService: SocketService,
  fcmService: FcmService,
): MessageNotifyHandler {
  messageNotifyHandler = new MessageNotifyHandler(socketService, fcmService);
  return messageNotifyHandler;
}

export function getMessageNotifyhandler(): MessageNotifyHandler {
  if (!messageNotifyHandler) {
    throw new Error('Messafe Notify socket handler is not initialized');
  }

  return messageNotifyHandler;
}
