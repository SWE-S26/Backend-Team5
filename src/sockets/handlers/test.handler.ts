// this is a simple example so that we can test

import { Socket } from 'socket.io';
import { SocketService } from '../socket.service';
import { SocketEvents } from '../socket.events';
import logger from '../../shared/logger/logger';

interface TestPayload {
  message: string;
}

/**
 * Registers the two test events on a socket:
 *
 *  - `test:send`    — client sends a message to the server
 *  - `test:receive` — server echoes it back to the same client
 */
export function registerTestHandlers(
  socket: Socket,
  socketService: SocketService,
): void {
  socket.on(SocketEvents.TEST_SEND, (payload: TestPayload) => {
    logger.info(
      `[test:send] from socket ${socket.id} — message: "${payload?.message}"`,
    );

    // Echo back to the sender only
    socketService.sendToSocket<{
      message: string;
      echo: boolean;
      timestamp: string;
    }>(socket.id, SocketEvents.TEST_RECEIVE, {
      message: payload?.message ?? '',
      echo: true,
      timestamp: new Date().toISOString(),
    });
  });
}
