import express from 'express';
import pinoHttp from 'pino-http';
import { initializeConfig } from './config/initializeConfig';
import integrationRouter from './modules/integration/router.integration';
import { errorHandler } from './shared/errors/errorHandlerMiddleware';
import invalidRouter from './shared/errors/router.invalid';
import logger from './shared/logger/logger';

const port = process.env.PORT || 4123;
const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api', integrationRouter);

app.use(invalidRouter);
app.use(errorHandler);

const start = async () => {
  try {
    await initializeConfig();
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error({ error }, `[Server] Failed to start:`);
    process.exit(1);
  }
};

start();
