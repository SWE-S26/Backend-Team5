//TODO: Seif make the middleware to decode the jwt and respond with 401 if not valid, and add the decoded user info to req.user
import { Request, Response, NextFunction } from 'express';
import { initializeConfig } from '../../config/initializeConfig';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/responseErrors';

function isCross(req: Request): boolean {
  const userAgent = req.headers['user-agent'] || '';
  // check if user Agent contains these
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let acessToken = '';
  if (isCross(req)) {
    acessToken = req.body.accessToken;
  } else {
    acessToken = req.cookies['acessToken'];
  }
  jwt.verify(acessToken, process.env.JWT_SECRET!, (err, payload) => {
    if (err) {
      throw UnauthorizedError('Unauthorized Access');
    } else {
      // if req.body it will be overwritten info is cleared
      (req as any).userInfo = payload;
      next();
    }
  });
};
