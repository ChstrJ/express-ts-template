export class Status {
  public static ACTIVE = 'active';
  public static INACTIVE = 'inactive';
  public static DELETED = 'deleted';
  public static PENDING = 'pending';
  public static PROCESSING = 'processing';
  public static SENT = 'sent';
  public static VERIFYING = 'verifying';
  public static PREPARING = 'preparing';
  public static APPROVED = 'approved';
  public static REJECTED = 'rejected';
  public static DECLINED = 'declined';
  public static WAITING = 'waiting';
  public static READY = 'ready';
  public static ACCEPTED = 'accepted';
  public static COMPLETED = 'completed';
  public static CANCELED = 'canceled';
  public static DRAFT = 'draft';
  public static SUCCESS = 'success';
  public static ERROR = 'error';
  public static FAIL = 'fail';
  public static FAILED = 'failed';
  public static VERIFIED = 'verified';
  public static IN = 'in';
  public static OUT = 'out';
  public static OPEN = 'open';
  public static CLOSED = 'closed';
  public static RESOLVED = 'resolved';
  public static IN_PROGRESS = 'in_progress';
  public static RELEASED = 'released';
  public static VOID = 'void';
  public static UNRELEASED = 'unreleased';
  public static ON_HOLD = 'on_hold';

  public static VALID_STATUSES = [Status.ACTIVE, Status.INACTIVE, Status.PENDING];
}
