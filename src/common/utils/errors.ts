import { ErrorCode } from '@common/constants/error-code';
import { GeneralMessage } from '@common/constants/message';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

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

export class TooManyRequestException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'TooManyRequestException';
    this.message = message;
    this.statusCode = StatusCodes.TOO_MANY_REQUESTS;
  }
}

export function makeError<TError extends Error>(error: TError) {
  const defaultError = {
    name: error.name,
    message: error.message
  };

  /* Custom Errors */
  if (error.message.includes('Malformed JSON')) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof BadRequestException) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof TooManyRequestException) {
    return {
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof UnauthorizedException) {
    return {
      statusCode: StatusCodes.UNAUTHORIZED,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof AlreadyExistsException) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof ForbiddenException) {
    return {
      statusCode: StatusCodes.FORBIDDEN,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof NotFoundException) {
    return {
      statusCode: StatusCodes.NOT_FOUND,
      error: defaultError,
      message: error.message
    };
  }

  if (error instanceof ConflictException) {
    return {
      statusCode: StatusCodes.CONFLICT,
      error: defaultError,
      message: error.message
    };
  }

  /* Library Errors */
  if (error instanceof ZodError) {
    /* Mostly for Controller's Payload Validation */
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      error: {
        ...defaultError,
        issues: error.issues
      }
    };
  }

  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    error: defaultError,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: GeneralMessage.SOMETHING_WENT_WRONG
  };
}
