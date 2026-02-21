export class Job {
  static EMAIL = 'email';
  static ALERT = 'alert';
  static COMMISSION = 'commission';
  static BONUS = 'bonus';
  static RANK = 'rank';
  static DISBURSE_COMMISSION = 'disburse_commission';
}

export class JobType {
  static UNRELEASED_COMMISSION = 'unreleased_commission';
  static ON_HOLD_COMMISSION = 'on_hold_commission';
  static COMPUTE_WEEKLY_COMMISSION = 'compute_weekly_commission';
  static COMPUTE_COMMISSION_BY_ACCOUNT = 'compute_commission_by_account';
  static ranks_snapshot = 'ranks_snapshot';
  static BONUS = 'bonus';
  static PROCESS_GOLD = 'process_gold';
  static PROCESS_PLATINUM = 'process_platinum';
  static PROCESS_DIAMOND = 'process_diamond';
}
