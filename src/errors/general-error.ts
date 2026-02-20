import { StatusCodes } from 'http-status-codes';
import { ErrorCode, errors } from './error-code';

export abstract class GeneralError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(code: string, statusCode: number, message?: string) {
        const errorDef = errors(code);
        super(message ?? errorDef.message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
    }
}

export class BadRequestError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.BAD_REQUEST, StatusCodes.BAD_REQUEST, message);
    }
}

export class UnauthorizedError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.UNAUTHORIZED, StatusCodes.UNAUTHORIZED, message);
    }
}

export class ForbiddenError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.FORBIDDEN, StatusCodes.FORBIDDEN, message);
    }
}

export class NotFoundError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.NOT_FOUND, StatusCodes.NOT_FOUND, message);
    }
}

export class MethodNotAllowedError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.METHOD_NOT_ALLOWED, StatusCodes.METHOD_NOT_ALLOWED, message);
    }
}

export class ConflictError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.CONFLICT, StatusCodes.CONFLICT, message);
    }
}

export class GoneError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.GONE, StatusCodes.GONE, message);
    }
}

export class PayloadTooLargeError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.PAYLOAD_TOO_LARGE, StatusCodes.REQUEST_TOO_LONG, message);
    }
}

export class UnprocessableEntityError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.UNPROCESSABLE_ENTITY, StatusCodes.UNPROCESSABLE_ENTITY, message);
    }
}

export class TooManyRequestsError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.TOO_MANY_REQUESTS, StatusCodes.TOO_MANY_REQUESTS, message);
    }
}

export class InternalServerError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.INTERNAL_SERVER_ERROR, StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
}

export class NotImplementedError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.NOT_IMPLEMENTED, StatusCodes.NOT_IMPLEMENTED, message);
    }
}

export class BadGatewayError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.BAD_GATEWAY, StatusCodes.BAD_GATEWAY, message);
    }
}

export class ServiceUnavailableError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.SERVICE_UNAVAILABLE, StatusCodes.SERVICE_UNAVAILABLE, message);
    }
}

export class GatewayTimeoutError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.GATEWAY_TIMEOUT, StatusCodes.GATEWAY_TIMEOUT, message);
    }
}

export class ValidationError extends GeneralError {
    public readonly errors: any;

    constructor(message?: string, validationErrors?: any) {
        super(ErrorCode.VALIDATION_ERROR, StatusCodes.BAD_REQUEST, message);
        this.errors = validationErrors;
    }
}

export class DuplicateEntryError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.DUPLICATE_ENTRY, StatusCodes.CONFLICT, message);
    }
}

export class ExpiredTokenError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.EXPIRED_TOKEN, StatusCodes.UNAUTHORIZED, message);
    }
}

export class InvalidTokenError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.INVALID_TOKEN, StatusCodes.UNAUTHORIZED, message);
    }
}

export class InsufficientPermissionsError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.INSUFFICIENT_PERMISSIONS, StatusCodes.FORBIDDEN, message);
    }
}

export class ResourceLockedError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.RESOURCE_LOCKED, StatusCodes.LOCKED, message);
    }
}

export class DependencyFailureError extends GeneralError {
    constructor(message?: string) {
        super(ErrorCode.DEPENDENCY_FAILURE, StatusCodes.FAILED_DEPENDENCY, message);
    }
}
