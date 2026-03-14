import { Request } from 'express';
import { z } from 'zod';

/**
 * The provided DTO must describe the *request structure* as an object
 * containing any of the following keys:
 * - `body`
 * - `params`
 * - `query`
 * - `headers`
 * @typeParam T - A Zod schema describing the request shape
 * @param RequestDTO - Zod schema that validates the request object
 * @param req - Express request object
 *
 * @returns A Zod `safeParse` result:
 * - `success: true` → `data` contains the typed request payload
 * - `success: false` → `error` contains validation issues
 */
export const parseRequest = <T extends z.ZodTypeAny>(
  RequestDTO: T,
  req: Request,
) => {
  return RequestDTO.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
  });
};
