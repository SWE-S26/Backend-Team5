import { Router } from 'express';
import { NotFoundError } from './responseErrors';
import logger from '../logger/logger';
const router = Router();

const invalidRouterDetector = (req: any, res: any, next: any) => {
  logger.warn(`Invalid route accessed!, ${req.url}`);
  throw NotFoundError('Invalid Route!');
};

router.use(invalidRouterDetector);

export default router;
