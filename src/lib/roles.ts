import type { StaffRole } from "@/lib/types";

export function isStaffRole(role: unknown): role is StaffRole {
  return role === "admin" || role === "super_admin" || role === "backend_admin";
}
