"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GetRowIdParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

type DataGridProps<T> = {
  rowData: T[];
  columnDefs: ColDef<T>[];
  getRowId: (params: GetRowIdParams<T>) => string;
  loading?: boolean;
  emptyMessage: string;
  context?: unknown;
};

export function DataGrid<T>({
  rowData,
  columnDefs,
  getRowId,
  loading = false,
  emptyMessage,
  context,
}: DataGridProps<T>) {
  return (
    <div className="ag-theme-quartz h-[66vh] w-full px-5 pb-2.5">
      <AgGridReact<T>
        rowData={rowData}
        columnDefs={columnDefs}
        getRowId={getRowId}
        defaultColDef={{
          sortable: true,
          cellStyle: { display: "flex", alignItems: "center" },
        }}
        loading={loading}
        context={context}
        overlayNoRowsTemplate={`<span style="padding:10px;color:#1A202C;">${escapeHtml(emptyMessage)}</span>`}
        domLayout="normal"
        onGridReady={(event) => event.api.sizeColumnsToFit()}
        onGridSizeChanged={(event) => event.api.sizeColumnsToFit()}
      />
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
