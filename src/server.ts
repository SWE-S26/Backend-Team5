import { createServer } from 'http';
import { Server } from 'socket.io';
import app, { allowedOrigins } from './app';
import { initializeConfig } from './config/initializeConfig';
import logger from './shared/logger/logger';
import { initSocket } from './sockets/socket.config';
import type { SocketService } from './sockets/socket.service';

const port = process.env.PORT || 4123;

export let socketService: SocketService;

const start = async () => {
  try {
    await initializeConfig();

    // Wrap Express in an HTTP server so Socket.io can share the same port
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
      },
    });

    socketService = initSocket(io);
    httpServer.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error({ error }, `[Server] Failed to start:`);
    process.exit(1);
  }
};

start();
