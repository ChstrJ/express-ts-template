type ErrorDefinition = {
  message: string;
};

export class ErrorCode {
  // 4xx Client Errors
  public static BAD_REQUEST = 'bad_request';
  public static UNAUTHORIZED = 'unauthorized';
  public static FORBIDDEN = 'forbidden';
  public static NOT_FOUND = 'not_found';
  public static METHOD_NOT_ALLOWED = 'method_not_allowed';
  public static CONFLICT = 'conflict';
  public static GONE = 'gone';
  public static PAYLOAD_TOO_LARGE = 'payload_too_large';
  public static UNPROCESSABLE_ENTITY = 'unprocessable_entity';
  public static TOO_MANY_REQUESTS = 'too_many_requests';

  // 5xx Server Errors
  public static INTERNAL_SERVER_ERROR = 'internal_server_error';
  public static NOT_IMPLEMENTED = 'not_implemented';
  public static BAD_GATEWAY = 'bad_gateway';
  public static SERVICE_UNAVAILABLE = 'service_unavailable';
  public static GATEWAY_TIMEOUT = 'gateway_timeout';

  // Domain / Business Logic Errors
  public static VALIDATION_ERROR = 'validation_error';
  public static DUPLICATE_ENTRY = 'duplicate_entry';
  public static EXPIRED_TOKEN = 'expired_token';
  public static INVALID_TOKEN = 'invalid_token';
  public static INSUFFICIENT_PERMISSIONS = 'insufficient_permissions';
  public static RESOURCE_LOCKED = 'resource_locked';
  public static DEPENDENCY_FAILURE = 'dependency_failure';
}

// central mapping
export const errorMap: Record<string, ErrorDefinition> = {
  // 4xx
  [ErrorCode.BAD_REQUEST]: { message: "Bad Request" },
  [ErrorCode.UNAUTHORIZED]: { message: "Unauthorized access" },
  [ErrorCode.FORBIDDEN]: { message: "User is forbidden to access this content" },
  [ErrorCode.NOT_FOUND]: { message: "Resource not found" },
  [ErrorCode.METHOD_NOT_ALLOWED]: { message: "HTTP method not allowed" },
  [ErrorCode.CONFLICT]: { message: "Resource conflict" },
  [ErrorCode.GONE]: { message: "Resource is no longer available" },
  [ErrorCode.PAYLOAD_TOO_LARGE]: { message: "Request payload is too large" },
  [ErrorCode.UNPROCESSABLE_ENTITY]: { message: "Request is well-formed but contains semantic errors" },
  [ErrorCode.TOO_MANY_REQUESTS]: { message: "Too many requests, please try again later" },

  // 5xx
  [ErrorCode.INTERNAL_SERVER_ERROR]: { message: "Internal Server Error" },
  [ErrorCode.NOT_IMPLEMENTED]: { message: "Feature not implemented" },
  [ErrorCode.BAD_GATEWAY]: { message: "Bad gateway" },
  [ErrorCode.SERVICE_UNAVAILABLE]: { message: "Service temporarily unavailable" },
  [ErrorCode.GATEWAY_TIMEOUT]: { message: "Gateway timeout" },

  // Domain / Business Logic
  [ErrorCode.VALIDATION_ERROR]: { message: "Validation failed" },
  [ErrorCode.DUPLICATE_ENTRY]: { message: "Resource already exists" },
  [ErrorCode.EXPIRED_TOKEN]: { message: "Token has expired" },
  [ErrorCode.INVALID_TOKEN]: { message: "Token is invalid" },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: { message: "Insufficient permissions for this action" },
  [ErrorCode.RESOURCE_LOCKED]: { message: "Resource is currently locked" },
  [ErrorCode.DEPENDENCY_FAILURE]: { message: "A dependent service or resource failed" },
};

// simple function to get error definition
export function errors(code: string): ErrorDefinition {
  return errorMap[code] ?? { message: "Internal Server Error" };
}
