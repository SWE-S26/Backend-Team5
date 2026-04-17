import { Request, Response, NextFunction } from 'express';
import JWTService from '../abstractions/jwt.service';
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
    if (!accessToken) {
      accessToken = req.cookies['accessToken'];
    }
  } else {
    accessToken = req.cookies['accessToken'];
  }

  if (!accessToken) {
    throw UnauthorizedError('Unauthorized Access');
  }

  const payload = JWTService.verifyJWTForMiddleware(accessToken);

  req.userInfo = payload;

  logger.info(
    {
      userId: payload!._id,
      role: payload!.role,
      paymentInfo: payload!.paymentInfo,
    },
    'Authenticated user',
  );

  next();
};
