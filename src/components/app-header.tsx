"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { IoIosLogOut } from "react-icons/io";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { currentCompany } from "@/lib/company";
import { displayName, roleLabel } from "@/lib/format";
import type { StaffRole } from "@/lib/types";

type AppHeaderProps = {
  name: string;
  email: string;
  role: StaffRole;
  actionLabel?: string;
  onAction?: () => void;
};

export function AppHeader({
  name,
  email,
  role,
  actionLabel,
  onAction,
}: AppHeaderProps) {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiFetch("/staff/logout/", { method: "POST" });
    } catch {
      // The local session still needs to close if the API is unreachable.
    }
    await signOut({ callbackUrl: `/${currentCompany()}` });
  }

  return (
    <header className="flex flex-col px-8 py-4">
      <div className="flex items-center justify-between">
        <BrandMark className="text-[22px] font-semibold" imageClassName="h-auto w-[180px]" />
        <div className="flex items-center">
          {actionLabel && onAction ? (
            <Button type="button" size="sm" className="mx-4" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          <button
            type="button"
            className="flex cursor-pointer items-center text-base text-black/70 hover:text-black/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pending}
            onClick={logout}
          >
            <span className="mr-1.5">Logout</span>
            <IoIosLogOut size={16} />
          </button>
        </div>
      </div>
      <div className="my-2 flex items-center justify-between">
        <p className="text-xl font-semibold">Welcome, {displayName(name, email)}.</p>
        <p className="text-base font-light text-[#A0AEC0]">{roleLabel(role)}</p>
      </div>
      <hr className="mt-3 border-[#E2E8F0]" />
    </header>
  );
}
