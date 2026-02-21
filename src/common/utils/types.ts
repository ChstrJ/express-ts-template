export type QueryParams = {
  limit?: string;
  offset?: string;
  order_by?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
};

export type Activity = {
  accountId: string;
  action: string;
  message: string;
  meta?: any;
  type?: string;
  typeId?: string | null;
}

export type ReferralCommissionRecord = {
  referrer_id: string;
  referee_id: string;
  referee_name: string;
  level: number;
  commission_percentage: number;
  commission_amount: number;
  total_pv: number;
  product_package_name?: string;
  total_amount?: number;
}

export type Downline = {
  account_id: string;
  account_email: string;
  account_name: string;
  account_image?: string;
  account_contact_number?: string;
  referred_by_id: string;
  team_member_status?: string;
  level: number;
  created_at?: Date;
}

export type MonthlySnapshot = {
  account_id: string;
  wallet_id: string;
  ranks_id: string;
  ranks_name: string;
  gv?: string;
  pv?: string;
}

export type RankType = {
  ranks_id: string;
  name: string;
  pv_req: number | null;
  gv_req: number | null;
  leg_cap: string;
  meta: RankMetaType;
  created_at?: Date;
  updated_at?: Date;
};

export type RankMetaType = {
  min_levels: number;
  max_levels: number;
  max_number: number;
  bonus?: number;
  group_bonus?: number;
  company_bonus?: number;
}