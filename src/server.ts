import app from './app';
import { initializeConfig } from './config/initializeConfig';
import logger from './shared/logger/logger';
import publitioMediaStorage from './shared/abstractions/publitio';

const port = process.env.PORT || 4123;

const start = async () => {
  try {
    await initializeConfig();
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`testing publitio`);
      logger.info(`${process.env.PUBLITO_KEY}`);
      logger.info(`${process.env.PUBLITO_SECRET}`);
      publitioMediaStorage.testUpload();
    });
  } catch (error) {
    logger.error({ error }, `[Server] Failed to start:`);
    process.exit(1);
  }
};

start();
