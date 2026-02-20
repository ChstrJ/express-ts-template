type ErrorDefinition = {
  message: string;
};

export class ErrorCode {
  public static FORBIDDEN = 'forbidden';
  public static UNAUTHORIZED = 'unauthorized';
  public static BAD_REQUEST = 'bad_request';
  public static NOT_FOUND = 'not_found';
  public static INTERNAL_SERVER_ERROR = 'internal_server_error';
}

// central mapping
const errorMap: Record<string, ErrorDefinition> = {
  [ErrorCode.FORBIDDEN]: { message: "User is forbidden to access this content" },
  [ErrorCode.UNAUTHORIZED]: { message: "Unauthorized access" },
  [ErrorCode.BAD_REQUEST]: { message: "Bad Request" },
  [ErrorCode.NOT_FOUND]: { message: "Resource not found" },
  [ErrorCode.INTERNAL_SERVER_ERROR]: { message: "Internal Server Error" },
};

// simple function to get error definition
export function errors(code: string): ErrorDefinition {
  return errorMap[code] ?? { message: "Internal Server Error" };
}
