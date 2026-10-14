"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { AdminsPanel } from "@/components/admins-panel";
import { AppHeader } from "@/components/app-header";
import { ClientsPanel } from "@/components/clients-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, apiFetch } from "@/lib/api";
import { currentCompany } from "@/lib/company";
import { isStaffRole } from "@/lib/roles";
import type { StaffProfile } from "@/lib/types";

type Section = "clients" | "admins";

export function DashboardScreen() {
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState(false);
  const [section, setSection] = useState<Section>("clients");
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const loginPage = `/${currentCompany()}`;
    if (!isStaffRole(session?.user?.role)) {
      void signOut({ callbackUrl: loginPage });
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
          .then(() => signOut({ callbackUrl: loginPage }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          void signOut({ callbackUrl: loginPage });
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

  const showingAdmins = section === "admins";

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        name={session.user.name}
        email={session.user.email}
        role={session.user.role}
        actionLabel={showingAdmins ? "New admin" : "New client"}
        onAction={() =>
          showingAdmins ? setCreateAdminOpen(true) : setCreateClientOpen(true)
        }
      />
      <Tabs
        value={section}
        onValueChange={(value) => {
          if (value === "clients" || value === "admins") setSection(value);
        }}
      >
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
      </Tabs>
      {showingAdmins ? (
        <AdminsPanel
          createOpen={createAdminOpen}
          onCreateOpenChange={setCreateAdminOpen}
        />
      ) : (
        <ClientsPanel
          createOpen={createClientOpen}
          onCreateOpenChange={setCreateClientOpen}
        />
      )}
    </div>
  );
}
