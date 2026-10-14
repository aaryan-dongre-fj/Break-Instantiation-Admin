import type { PortalInviteStatus, StaffRole } from "@/lib/types";

export function roleLabel(role: StaffRole | string) {
  if (role === "admin" || role === "super_admin") return "Admin";
  if (role === "backend_admin") return "Backend Admin";
  return role;
}

export function inviteLabel(status: PortalInviteStatus | null) {
  switch (status) {
    case "sent":
      return "Sent";
    case "opened":
      return "Opened";
    case "accepted":
      return "Accepted";
    case "expired":
      return "Expired";
    default:
      return "Not invited";
  }
}

export function inviteBadgeVariant(
  status: PortalInviteStatus | null,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "accepted") return "default";
  if (status === "expired") return "destructive";
  if (status === "sent" || status === "opened") return "secondary";
  return "outline";
}

export function displayName(name: string, email: string) {
  const trimmed = name.trim();
  return trimmed || email;
}
