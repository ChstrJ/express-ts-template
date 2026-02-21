export class Role {
  static SUPER_ADMIN = 'super_admin';
  static ADMIN = 'admin';
  static CSR = 'csr';
  static STAFF = 'staff';
  static FINANCE = 'finance';
  static WAREHOUSE = 'warehouse';
  static DISTRIBUTOR = 'distributor';

  static ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.CSR, Role.WAREHOUSE, Role.FINANCE];

  static STAFF_ROLES = [Role.CSR, Role.WAREHOUSE, Role.FINANCE];

  static VALID_ROLES = [Role.ADMIN, Role.DISTRIBUTOR];
}
