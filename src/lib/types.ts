export type TenantRole = "admin" | "super_admin";

export type StaffRole = TenantRole | "backend_admin";

export type StaffProfile = {
  id: number;
  email: string;
  name: string;
  role: StaffRole;
};

export type PortalInviteStatus = "sent" | "opened" | "accepted" | "expired";

export type ClientRecord = {
  id: string;
  full_name: string;
  email: string;
  admin: number | null;
  admin_email: string | null;
  has_login: boolean;
  portal_invite_status: PortalInviteStatus | null;
};
