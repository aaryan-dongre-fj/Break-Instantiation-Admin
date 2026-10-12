"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Loader2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataGrid } from "@/components/data-grid";
import { RecordCount, SearchField } from "@/components/panel-toolbar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, apiFetch, asList } from "@/lib/api";
import { inviteLabel } from "@/lib/format";
import type { ClientRecord, StaffProfile } from "@/lib/types";

type ClientsPanelProps = {
  isSuperAdmin: boolean;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
};

type ClientGridContext = {
  invite: (client: ClientRecord) => void;
  invitingId: string | null;
  openAssign: (client: ClientRecord) => void;
};

export function ClientsPanel({
  isSuperAdmin,
  createOpen,
  onCreateOpenChange,
}: ClientsPanelProps) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [admins, setAdmins] = useState<StaffProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [assignClient, setAssignClient] = useState<ClientRecord | null>(null);

  async function loadClients() {
    setLoading(true);
    setError("");
    try {
      const rows = await apiFetch<unknown>("/clients/");
      setClients(asList<ClientRecord>(rows));
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load clients.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch<unknown>("/clients/")
      .then((rows) => {
        if (!cancelled) setClients(asList<ClientRecord>(rows));
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load clients.",
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

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    apiFetch<unknown>("/staff/admins/")
      .then((rows) => {
        if (!cancelled) setAdmins(asList<StaffProfile>(rows));
      })
      .catch(() => {
        if (!cancelled) setAdmins([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => {
      return [client.full_name, client.email, client.admin_email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [clients, search]);

  const invite = useCallback(async (client: ClientRecord) => {
    setInvitingId(client.id);
    try {
      await apiFetch(`/clients/${client.id}/invite/`, { method: "POST" });
      toast.success("Invitation sent.");
      const rows = await apiFetch<unknown>("/clients/");
      setClients(asList<ClientRecord>(rows));
    } catch (inviteError) {
      toast.error("Invite failed", {
        description:
          inviteError instanceof ApiError
            ? inviteError.message
            : "Could not send the invitation.",
      });
    } finally {
      setInvitingId(null);
    }
  }, []);

  const openAssign = useCallback((client: ClientRecord) => {
    setAssignClient(client);
  }, []);

  const columnDefs = useMemo<ColDef<ClientRecord>[]>(() => {
    const columns: ColDef<ClientRecord>[] = [
      { field: "full_name", headerName: "Name", minWidth: 110, flex: 1.1 },
      { field: "email", headerName: "Email Address", minWidth: 150, flex: 1.4 },
    ];
    if (isSuperAdmin) {
      columns.push({
        colId: "admin",
        headerName: "Admin",
        minWidth: 220,
        flex: 1.4,
        cellRenderer: AdminCell,
      });
    }
    columns.push(
      {
        field: "has_login",
        headerName: "Portal",
        minWidth: 110,
        flex: 0.8,
        cellRenderer: PortalCell,
      },
      {
        field: "portal_invite_status",
        headerName: "Invite",
        minWidth: 100,
        flex: 0.7,
        cellRenderer: InviteCell,
      },
      {
        colId: "actions",
        headerName: "Actions",
        sortable: false,
        minWidth: 140,
        flex: 0.9,
        cellRenderer: InviteActionCell,
        cellRendererParams: { invitingId },
      },
    );
    return columns;
  }, [isSuperAdmin, invitingId]);

  const emptyMessage =
    clients.length === 0
      ? "No clients yet. Create one to send a portal invite."
      : "No clients match that search.";

  return (
    <section>
      <div className="px-8">
        <SearchField
          label="Search for Clients"
          placeholder="Search for clients by name or email address"
          value={search}
          onChange={setSearch}
        />
      </div>
      {error ? (
        <div className="mx-8 mt-3 flex items-center justify-between rounded-[0.375rem] bg-[#FED7D7] px-4 py-3 text-sm text-[#822727]">
          <span>{error}</span>
          <Button type="button" variant="gray" size="sm" onClick={loadClients}>
            Retry
          </Button>
        </div>
      ) : null}
      <RecordCount count={visible.length} singular="client record" plural="client records" />
      <DataGrid
        rowData={visible}
        columnDefs={columnDefs}
        getRowId={(params) => params.data.id}
        loading={loading}
        emptyMessage={emptyMessage}
        context={{ invite, invitingId, openAssign }}
      />
      <AssignAdminDialog
        client={assignClient}
        admins={admins}
        onOpenChange={(open) => {
          if (!open) setAssignClient(null);
        }}
        onAssigned={(updated) => {
          setClients((current) =>
            current.map((row) => (row.id === updated.id ? updated : row)),
          );
          setAssignClient(null);
        }}
      />
      <CreateClientDialog
        open={createOpen}
        admins={admins}
        isSuperAdmin={isSuperAdmin}
        onOpenChange={onCreateOpenChange}
        onCreated={loadClients}
      />
    </section>
  );
}

function staffOptionLabel(admin: StaffProfile) {
  return admin.name.trim() ? `${admin.name.trim()} (${admin.email})` : admin.email;
}

function AdminCell(props: ICellRendererParams<ClientRecord, unknown, ClientGridContext>) {
  const client = props.data;
  if (!client) return null;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate">{client.admin_email ?? "Unassigned"}</span>
      <Button
        type="button"
        size="sm"
        variant="gray"
        onClick={() => props.context.openAssign(client)}
      >
        {client.admin ? "Change" : "Assign"}
      </Button>
    </div>
  );
}

function PortalCell(props: ICellRendererParams<ClientRecord>) {
  if (!props.data) return null;
  return (
    <Badge variant={props.data.has_login ? "green" : "gray"}>
      {props.data.has_login ? "Has access" : "No login"}
    </Badge>
  );
}

function InviteCell(props: ICellRendererParams<ClientRecord>) {
  if (!props.data) return null;
  const status = props.data.portal_invite_status;
  const variant = status === "accepted" ? "green" : status === "expired" ? "red" : "gray";
  return <Badge variant={variant}>{inviteLabel(status)}</Badge>;
}

function InviteActionCell(
  props: ICellRendererParams<ClientRecord, unknown, ClientGridContext> & {
    invitingId: string | null;
  },
) {
  const client = props.data;
  if (!client) return null;
  const pending = props.invitingId === client.id;
  return (
    <Button
      type="button"
      size="sm"
      disabled={client.has_login || pending}
      onClick={() => props.context.invite(client)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {client.has_login
        ? "Access granted"
        : client.portal_invite_status
          ? "Resend invite"
          : "Send invite"}
    </Button>
  );
}

function AssignAdminDialog({
  client,
  admins,
  onOpenChange,
  onAssigned,
}: {
  client: ClientRecord | null;
  admins: StaffProfile[];
  onOpenChange: (open: boolean) => void;
  onAssigned: (client: ClientRecord) => void;
}) {
  if (!client) return null;
  return (
    <AssignAdminForm
      key={`${client.id}:${client.admin ?? "none"}`}
      client={client}
      admins={admins}
      onOpenChange={onOpenChange}
      onAssigned={onAssigned}
    />
  );
}

function AssignAdminForm({
  client,
  admins,
  onOpenChange,
  onAssigned,
}: {
  client: ClientRecord;
  admins: StaffProfile[];
  onOpenChange: (open: boolean) => void;
  onAssigned: (client: ClientRecord) => void;
}) {
  const [adminId, setAdminId] = useState(
    client.admin == null ? "unassigned" : String(client.admin),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const adminItems = [
    { value: "unassigned", label: "Unassigned" },
    ...admins.map((admin) => ({
      value: String(admin.id),
      label: staffOptionLabel(admin),
    })),
  ];
  if (
    client.admin != null &&
    !adminItems.some((item) => item.value === String(client.admin))
  ) {
    adminItems.push({
      value: String(client.admin),
      label: client.admin_email ?? "Assigned admin",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch<ClientRecord>(`/clients/${client.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          admin: adminId === "unassigned" ? null : Number(adminId),
        }),
      });
      toast.success(updated.admin ? "Admin assigned." : "Assignment cleared.");
      onAssigned(updated);
    } catch (assignError) {
      setError(
        assignError instanceof ApiError
          ? assignError.message
          : "Could not assign the admin.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 px-6 py-2">
            <p className="text-base text-[#1A202C]">
              {client.full_name} ({client.email})
            </p>
            <div className="flex flex-col gap-2">
              <Label>Responsible admin</Label>
              <Select
                items={adminItems}
                value={adminId}
                onValueChange={(value) => setAdminId(value ?? "unassigned")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {adminItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-[#C53030]">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="gray" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateClientDialog({
  open,
  admins,
  isSuperAdmin,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  admins: StaffProfile[];
  isSuperAdmin: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState("unassigned");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const adminItems = [
    { value: "unassigned", label: "Unassigned" },
    ...admins.map((admin) => ({
      value: String(admin.id),
      label: admin.name.trim()
        ? `${admin.name.trim()} (${admin.email})`
        : admin.email,
    })),
  ];

  function reset() {
    setFullName("");
    setEmail("");
    setAdminId("unassigned");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload: {
      full_name: string;
      email: string;
      admin?: number | null;
    } = {
      full_name: fullName.trim(),
      email: email.trim(),
    };
    if (isSuperAdmin) {
      payload.admin = adminId === "unassigned" ? null : Number(adminId);
    }

    try {
      await apiFetch<ClientRecord>("/clients/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Client created.");
      reset();
      onOpenChange(false);
      await onCreated();
    } catch (createError) {
      setError(
        createError instanceof ApiError
          ? createError.message
          : "Could not create the client.",
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
          <DialogTitle>Enter Client Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 px-6 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-name">Name</Label>
              <Input
                id="client-name"
                value={fullName}
                maxLength={255}
                required
                placeholder="Enter name"
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-email">Email Address</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                required
                placeholder="Enter email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {isSuperAdmin ? (
              <div className="flex flex-col gap-2">
                <Label>Responsible admin</Label>
                <Select
                  items={adminItems}
                  value={adminId}
                  onValueChange={(value) => setAdminId(value ?? "unassigned")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {adminItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {error ? <p className="text-sm text-[#C53030]">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="gray" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={saving || !fullName.trim() || !email.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Create client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
