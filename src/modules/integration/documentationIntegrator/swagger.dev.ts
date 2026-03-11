import { Router } from 'express';
const router = Router();

import dotenv from 'dotenv';
dotenv.config();

import logger from '../../../shared/logger/logger';

async function applyDevSwaggerRoute() {
  if (process.env.MODE === 'DEV') {
    const { default: swaggerUi } = await import('swagger-ui-express');
    const { default: combinedSwaggerDoc } =
      await import('../swagger.integration');

    router.use('/docs', swaggerUi.serve, swaggerUi.setup(combinedSwaggerDoc));
    logger.info('Swagger UI available at /docs (development only)');
  }
}

applyDevSwaggerRoute();

export default router;
