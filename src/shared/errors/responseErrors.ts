export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    // Preserve proper prototype chain
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export const GoneError = (message = 'Resource is no longer available') => {
  throw new HttpError(410, message);
};

// Convenience helpers
export const ResourceAlreadyExists = (message = 'Not found') => {
  throw new HttpError(409, message);
};

export const NotFoundError = (message = 'Not found') => {
  throw new HttpError(404, message);
};
export const BadRequestError = (message = 'Bad request') => {
  throw new HttpError(400, message);
};
export const UnauthorizedError = (message = 'Unauthorized') => {
  throw new HttpError(401, message);
};
export const ForbiddenError = (message = 'Forbidden') => {
  throw new HttpError(403, message);
};
export const InternalServerError = (message = 'Internal server error') => {
  throw new HttpError(500, message);
};
