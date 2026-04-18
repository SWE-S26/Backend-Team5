import { Request, Response, NextFunction } from 'express';
import JWTService from '../abstractions/jwt.service';

function isCross(req: Request): boolean {
  const userAgent = req.headers['user-agent'] || '';

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
}

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
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
    next();
    return;
  }

  try {
    const payload = JWTService.verifyJWTForMiddleware(accessToken);
    if (payload) {
      req.userInfo = payload;
    }
  } catch {
    // Ignore invalid token for public routes; continue as anonymous.
  }

  next();
};
