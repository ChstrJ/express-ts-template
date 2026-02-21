export class GeneralMessage {
  public static SUCCESS = 'Request processed successfully.';
  public static CREATED = 'Resource created successfully.';
  public static UPDATED = 'Resource updated successfully.';
  public static DELETED = 'Resource deleted successfully.';

  public static BAD_REQUEST = 'Invalid request data.';
  public static UNAUTHORIZED = 'Unauthorized access.';
  public static FORBIDDEN = 'Forbidden access.';
  public static NOT_FOUND = 'Resource not found.';
  public static METHOD_NOT_ALLOWED = 'Method not allowed.';

  public static INTERNAL_SERVER_ERROR = 'Internal server error.';
  public static SOMETHING_WENT_WRONG = 'Something went wrong.';
  public static SERVICE_UNAVAILABLE = 'Service unavailable.';
  public static TIMEOUT = 'Request timed out.';

  public static INVALID_FIELDS = 'Some required fields are missing or invalid';
  public static INVALID_CREDENTIALS = 'The username or password you entered is incorrect.';
  public static ALREADY_EXISTS = 'The account already exists.';
}
