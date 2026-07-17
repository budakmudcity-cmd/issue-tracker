"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { Issue } from "@/types";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ProjectIssuesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("issues").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).then(({ data }) => {
      setIssues(data || []);
      setLoading(false);
    });
  }, [projectId]);

  const columns = useMemo<ColumnDef<Issue>[]>(() => [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.original.id.slice(0, 8)}</span> },
    { accessorKey: "module", header: ({ column }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}><ArrowUpDown className="h-3 w-3 mr-1" />Module</Button> },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.description}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge> },
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => <Badge className={row.original.priority === "Critical" ? "bg-red-100 text-red-700" : row.original.priority === "High" ? "bg-orange-100 text-orange-700" : row.original.priority === "Medium" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>{row.original.priority}</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge className={row.original.status === "Closed" ? "bg-green-100 text-green-700" : row.original.status === "Open" ? "bg-blue-100 text-blue-700" : row.original.status === "In Progress" ? "bg-yellow-100 text-yellow-700" : row.original.status === "Testing" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}>{row.original.status}</Badge> },
    { accessorKey: "issue_by", header: "Issue By" },
    { accessorKey: "issue_date", header: "Issue Date", cell: ({ row }) => row.original.issue_date ? formatDate(row.original.issue_date) : "-" },
    { accessorKey: "base", header: "Base" },
    { accessorKey: "verified", header: "Verified", cell: ({ row }) => row.original.verified ? "Yes" : "No" },
    { accessorKey: "verified_by", header: "Verified By" },
  ], []);

  const table = useReactTable({
    data: issues,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const exportCSV = () => {
    const headers = ["ID", "Module", "Description", "Type", "Priority", "Status", "Issue By", "Issue Date", "Base", "Verified", "Verified By"];
    const rows = issues.map((i) => [i.id, i.module, `"${i.description.replace(/"/g, '""')}"`, i.type, i.priority, i.status, i.issue_by, i.issue_date, i.base, i.verified ? "Yes" : "No", i.verified_by]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Issues</h1>
          <p className="text-muted-foreground text-sm">{issues.length} total issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          {(profile?.role === "admin" || profile?.role === "user") && (
            <Button size="sm" onClick={() => router.push(`/projects/${projectId}/issues/new`)}><Plus className="h-4 w-4 mr-1" />New Issue</Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Search all fields..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/projects/${projectId}/issues/${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No issues found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
