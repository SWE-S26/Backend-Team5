import { Server, Socket } from 'socket.io';
import JWTService from '../shared/abstractions/jwt.service';
import logger from '../shared/logger/logger';
import { SocketService } from './socket.service';
import { SocketEvents } from './socket.events';
import { registerTestHandlers } from './handlers/test.handler';
import { initializeNotificationSocketHandler } from './handlers/notification.handler';

declare module 'socket.io' {
  interface SocketData {
    userId: string;
    role: string;
  }
}

function attachAuthMiddleware(io: Server): void {
  io.use((socket, next) => {
    let token: string = (socket.handshake.headers?.token as string) || '';
    // console.log('Received socket connection with token:', token);

    if (!token) {
      token = (socket.handshake.query?.token as string) || '';
      // console.log('Checked query params, token:', token);
    }

    if (!token) {
      token = socket.handshake.headers?.authorization?.split(' ')[1] || '';
      // console.log('Checked auth payload, token:', token);
      // req.headers['authorization']?.split(' ')[1]
    }

    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie ?? '';
      const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
      token = match?.[1] ?? '';
    }

    if (!token) {
      logger.warn(
        `[Socket] Rejected unauthenticated connection attempt (socket ${socket.id})`,
      );
      return next(new Error('Unauthorized'));
    }

    let payload;
    try {
      payload = JWTService.verifyJWTForMiddleware(token);
    } catch {
      logger.warn(
        `[Socket] Rejected invalid/expired token (socket ${socket.id})`,
      );
      return next(new Error('Unauthorized'));
    }

    if (!payload) {
      logger.warn(
        `[Socket] Rejected invalid/expired token (socket ${socket.id})`,
      );
      return next(new Error('Unauthorized'));
    }

    socket.data.userId = payload._id;
    socket.data.role = payload.role;

    next();
  });
}

export function initSocket(io: Server): SocketService {
  const socketService = new SocketService(io);
  initializeNotificationSocketHandler(socketService);

  attachAuthMiddleware(io);

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data;

    logger.info(
      `[Socket] User connected — userId: ${userId}, role: ${role}, socketId: ${socket.id}`,
    );

    socketService.registerUser(userId, socket.id);

    socketService.sendToSocket(socket.id, SocketEvents.USER_CONNECTED, {
      socketId: socket.id,
      userId,
    });

    registerTestHandlers(socket, socketService);
    // future: registerChatHandlers(socket, socketService);

    socket.on('disconnect', (reason) => {
      socketService.unregisterSocket(socket.id);
      logger.info(
        `[Socket] User disconnected — userId: ${userId}, reason: ${reason}`,
      );
    });
  });

  return socketService;
}
