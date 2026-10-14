"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataGrid } from "@/components/data-grid";
import { RecordCount, SearchField } from "@/components/panel-toolbar";
import { PasswordInput } from "@/components/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch, asList } from "@/lib/api";
import { displayName, roleLabel } from "@/lib/format";
import type { StaffProfile } from "@/lib/types";

type AdminsPanelProps = {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
};

export function AdminsPanel({ createOpen, onCreateOpenChange }: AdminsPanelProps) {
  const [admins, setAdmins] = useState<StaffProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdmins() {
    setLoading(true);
    setError("");
    try {
      const rows = await apiFetch<unknown>("/staff/admins/");
      setAdmins(asList<StaffProfile>(rows));
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load admins.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch<unknown>("/staff/admins/")
      .then((rows) => {
        if (!cancelled) setAdmins(asList<StaffProfile>(rows));
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load admins.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return admins;
    return admins.filter((admin) => {
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
      );
    });
  }, [admins, search]);

  const columnDefs = useMemo<ColDef<StaffProfile>[]>(
    () => [
      {
        headerName: "Name",
        minWidth: 140,
        flex: 1,
        valueGetter: (params) =>
          params.data ? displayName(params.data.name, params.data.email) : "",
      },
      { field: "email", headerName: "Email Address", minWidth: 180, flex: 1.4 },
      {
        field: "role",
        headerName: "Role",
        minWidth: 120,
        flex: 0.6,
        cellRenderer: RoleCell,
      },
    ],
    [],
  );

  const emptyMessage =
    admins.length === 0
      ? "No admins yet."
      : "No admins match that search.";

  return (
    <section>
      <div className="px-8">
        <SearchField
          label="Search for Admins"
          placeholder="Search for admins by name or email address"
          value={search}
          onChange={setSearch}
        />
      </div>
      {error ? (
        <div className="mx-8 mt-3 flex items-center justify-between rounded-[0.375rem] bg-[#FED7D7] px-4 py-3 text-sm text-[#822727]">
          <span>{error}</span>
          <Button type="button" variant="gray" size="sm" onClick={loadAdmins}>
            Retry
          </Button>
        </div>
      ) : null}
      <RecordCount count={visible.length} singular="admin record" plural="admin records" />
      <DataGrid
        rowData={visible}
        columnDefs={columnDefs}
        getRowId={(params) => String(params.data.id)}
        loading={loading}
        emptyMessage={emptyMessage}
      />
      <CreateAdminDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        onCreated={loadAdmins}
      />
    </section>
  );
}

function RoleCell(props: ICellRendererParams<StaffProfile>) {
  if (!props.data) return null;
  return <Badge>{roleLabel(props.data.role)}</Badge>;
}

function CreateAdminDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch<StaffProfile>("/staff/admins/", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      toast.success("Admin created.");
      reset();
      onOpenChange(false);
      await onCreated();
    } catch (createError) {
      setError(
        createError instanceof ApiError
          ? createError.message
          : "Could not create the admin.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Admin Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 px-6 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={name}
                maxLength={255}
                placeholder="Enter name"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                required
                autoComplete="off"
                placeholder="Enter email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Password</Label>
              <PasswordInput
                id="admin-password"
                value={password}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                onChange={setPassword}
              />
              <p className="text-sm text-[#718096]">
                At least 8 characters. Avoid common or all-numeric passwords.
              </p>
            </div>
            {error ? <p className="text-sm text-[#C53030]">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="gray" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={saving || !email.trim() || !password}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Create admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
