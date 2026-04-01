import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from './responseErrors';
import logger from '../logger/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  if (err instanceof Error) {
    logger.error(`Unexpected error occurred: ${err.message}`);
  } else {
    logger.error(`Unexpected error occurred: ${JSON.stringify(err)}`);
  }

  // Fallback for unexpected errors
  return res.status(500).json({ message: 'Internal server error' });
};
