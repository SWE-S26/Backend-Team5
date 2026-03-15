import { Request, Response, NextFunction } from 'express';
import JWTService from '../abstractions/jwt';
import { UnauthorizedError } from '../errors/responseErrors';
import logger from '../logger/logger';

function isCross(req: Request): boolean {
  const userAgent = req.headers['user-agent'] || '';

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let accessToken = '';

  if (isCross(req)) {
    accessToken = req.headers['authorization']?.split(' ')[1] || '';
  } else {
    accessToken = req.cookies['accessToken'];
  }

  if (!accessToken) {
    throw UnauthorizedError('Unauthorized Access');
  }

  const payload = JWTService.verifyJWTForMiddleware(accessToken);

  req.userInfo = payload;

  logger.info(
    `Authenticated user with ID: ${payload!._id} and role: ${payload!.role}, paymentInfo: ${JSON.stringify(payload!.paymentInfo)}`,
  );

  next();
};
