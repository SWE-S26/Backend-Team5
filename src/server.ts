import express from 'express';
import { initializeConfig } from './config/initializeConfig';
import integrationRouter from './modules/integration/router.integration';
import { errorHandler } from './shared/errors/errorHandlerMiddleware';
import invalidRouter from './shared/errors/router.invalid';
import { log } from './shared/logger/logger';

const port = process.env.PORT || 4123;
const app = express();

app.use(express.json());
app.use('/api', integrationRouter);
app.use(invalidRouter);
app.use(errorHandler);

const start = async () => {
  try {
    await initializeConfig();
    app.listen(port, () => {
      log(`Server running on port ${port}`);
    });
  } catch (error) {
    log('[Server] Failed to start:', 'error');
    process.exit(1);
  }
};

start();
