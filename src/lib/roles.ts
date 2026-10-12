import type { StaffRole } from "@/lib/types";

export function isStaffRole(role: unknown): role is StaffRole {
  return role === "admin" || role === "super_admin" || role === "backend_admin";
}

export function canManageAll(role: unknown): boolean {
  return role === "super_admin" || role === "backend_admin";
}

export function isBackendAdmin(role: unknown): boolean {
  return role === "backend_admin";
}
