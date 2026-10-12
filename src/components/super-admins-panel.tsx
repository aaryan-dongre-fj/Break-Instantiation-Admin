"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";

import { DataGrid } from "@/components/data-grid";
import { RecordCount, SearchField } from "@/components/panel-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, asList } from "@/lib/api";
import { displayName, roleLabel } from "@/lib/format";
import type { StaffProfile } from "@/lib/types";

export function SuperAdminsPanel() {
  const [superAdmins, setSuperAdmins] = useState<StaffProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSuperAdmins() {
    setLoading(true);
    setError("");
    try {
      const rows = await apiFetch<unknown>("/staff/super-admins/");
      setSuperAdmins(asList<StaffProfile>(rows));
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load super admins.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch<unknown>("/staff/super-admins/")
      .then((rows) => {
        if (!cancelled) setSuperAdmins(asList<StaffProfile>(rows));
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load super admins.",
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
    if (!query) return superAdmins;
    return superAdmins.filter((admin) => {
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
      );
    });
  }, [superAdmins, search]);

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
        minWidth: 140,
        flex: 0.6,
        cellRenderer: RoleCell,
      },
    ],
    [],
  );

  const emptyMessage =
    superAdmins.length === 0
      ? "No super admins yet."
      : "No super admins match that search.";

  return (
    <section>
      <div className="px-8">
        <SearchField
          label="Search for Super Admins"
          placeholder="Search for super admins by name or email address"
          value={search}
          onChange={setSearch}
        />
      </div>
      {error ? (
        <div className="mx-8 mt-3 flex items-center justify-between rounded-[0.375rem] bg-[#FED7D7] px-4 py-3 text-sm text-[#822727]">
          <span>{error}</span>
          <Button type="button" variant="gray" size="sm" onClick={loadSuperAdmins}>
            Retry
          </Button>
        </div>
      ) : null}
      <RecordCount
        count={visible.length}
        singular="super admin record"
        plural="super admin records"
      />
      <DataGrid
        rowData={visible}
        columnDefs={columnDefs}
        getRowId={(params) => String(params.data.id)}
        loading={loading}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}

function RoleCell(props: ICellRendererParams<StaffProfile>) {
  if (!props.data) return null;
  return <Badge>{roleLabel(props.data.role)}</Badge>;
}
