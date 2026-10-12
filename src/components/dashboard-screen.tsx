"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { AdminsPanel } from "@/components/admins-panel";
import { AppHeader } from "@/components/app-header";
import { ClientsPanel } from "@/components/clients-panel";
import { SuperAdminsPanel } from "@/components/super-admins-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, apiFetch } from "@/lib/api";
import { canManageAll, isBackendAdmin, isStaffRole } from "@/lib/roles";
import type { StaffProfile } from "@/lib/types";

type Section = "clients" | "admins" | "super_admins";

export function DashboardScreen() {
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState(false);
  const [section, setSection] = useState<Section>("clients");
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isStaffRole(session?.user?.role)) {
      void signOut({ callbackUrl: "/" });
      return;
    }

    let cancelled = false;
    apiFetch<StaffProfile>("/staff/me/")
      .then((user) => {
        if (cancelled) return;
        if (isStaffRole(user.role)) {
          setAllowed(true);
          return;
        }
        return apiFetch("/staff/logout/", { method: "POST" })
          .catch(() => undefined)
          .then(() => signOut({ callbackUrl: "/" }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          void signOut({ callbackUrl: "/" });
          return;
        }
        setAllowed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [session, status]);

  if (status === "loading" || (status === "authenticated" && !allowed)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-base">
        Loading…
      </div>
    );
  }

  if (!session?.user || !isStaffRole(session.user.role)) return null;

  const managesAll = canManageAll(session.user.role);
  const backendAdmin = isBackendAdmin(session.user.role);
  const showingAdmins = managesAll && section === "admins";
  const showingSuperAdmins = backendAdmin && section === "super_admins";

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        role={session.user.role}
        actionLabel={
          showingSuperAdmins ? undefined : showingAdmins ? "New admin" : "New client"
        }
        onAction={
          showingSuperAdmins
            ? undefined
            : () =>
                showingAdmins ? setCreateAdminOpen(true) : setCreateClientOpen(true)
        }
      />
      {managesAll ? (
        <Tabs
          value={showingSuperAdmins ? "super_admins" : section}
          onValueChange={(value) => {
            if (value === "clients" || value === "admins") setSection(value);
            if (value === "super_admins" && backendAdmin) setSection(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            {backendAdmin ? (
              <TabsTrigger value="super_admins">Super Admins</TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>
      ) : null}
      {showingSuperAdmins ? (
        <SuperAdminsPanel />
      ) : showingAdmins ? (
        <AdminsPanel
          createOpen={createAdminOpen}
          onCreateOpenChange={setCreateAdminOpen}
        />
      ) : (
        <ClientsPanel
          isSuperAdmin={managesAll}
          createOpen={createClientOpen}
          onCreateOpenChange={setCreateClientOpen}
        />
      )}
    </div>
  );
}
