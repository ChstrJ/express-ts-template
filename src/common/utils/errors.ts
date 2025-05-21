import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import config from '../../config/config';

export class BadRequestException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestException';
    this.message = message;
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

export class AlreadyExistsException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'AlreadyExistsException';
    this.message = message;
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

export class ValidationException extends Error {
  statusCode: number;
  errors: any;

  constructor(message: string, errors: any) {
    super(message);
    this.name = 'ValidationException';
    this.message = message;
    this.statusCode = StatusCodes.BAD_REQUEST;
    this.errors = errors;
  }
}

export class UnauthorizedException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedException';
    this.message = message;
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export class ForbiddenException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenException';
    this.message = message;
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export class TokenException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'TokenException';
    this.message = message;
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export class NotFoundException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundException';
    this.message = message;
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

export class ConflictException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictException';
    this.message = message;
    this.statusCode = StatusCodes.CONFLICT;
  }
}

export function makeError<TError extends Error>(error: TError) {
  const defaultError = {
    name: error.name,
    message: error.message,
  };

  let statusCode = null;
  let errors = [];

  /* Custom Errors */
  if (error.message.includes('Malformed JSON')) {
    statusCode: StatusCodes.BAD_REQUEST;
  }

  if (error instanceof BadRequestException) {
    statusCode: StatusCodes.BAD_REQUEST;
  }

  if (error instanceof UnauthorizedException) {
    return {
      statusCode: StatusCodes.UNAUTHORIZED,
      error: defaultError,
    };
  }

  if (error instanceof ForbiddenException) {
    return {
      statusCode: StatusCodes.FORBIDDEN,
      error: defaultError,
    };
  }

  if (error instanceof NotFoundException) {
    return {
      statusCode: StatusCodes.NOT_FOUND,
      error: defaultError,
    };
  }

  if (error instanceof ConflictException) {
    return {
      statusCode: StatusCodes.CONFLICT,
      error: defaultError,
    };
  }

  /* Library Errors */
  if (error instanceof ZodError) {
    /* Mostly for Controller's Payload Validation */
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      error: {
        ...defaultError,
        issues: error.issues,
      },
    };
  }

  return {
    error: true,
    timestamp: Date.now(),
    message: error.message || 'An error occured.',
    code: statusCode,
    stack: config.stage === 'development' ? error.stack : undefined,
  }

}

