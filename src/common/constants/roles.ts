export class Role {
  static SUPER_ADMIN = 'super_admin';
  static ADMIN = 'admin';
  static CSR = 'csr';
  static STAFF = 'staff';
  static DISTRIBUTOR = 'distributor';

  static ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.CSR];

  static VALID_ROLES = [Role.ADMIN, Role.DISTRIBUTOR];
}
