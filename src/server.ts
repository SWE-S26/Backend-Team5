import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initializeConfig } from './config/initializeConfig';
import logger from './shared/logger/logger';
import publitioMediaStorage from './shared/abstractions/publitio';
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
      cors: { origin: '*' },
    });

    socketService = initSocket(io);

    httpServer.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`testing publitio`);
      publitioMediaStorage.testDelete('PbgfBAnb');
    });
  } catch (error) {
    logger.error({ error }, `[Server] Failed to start:`);
    process.exit(1);
  }
};

start();
