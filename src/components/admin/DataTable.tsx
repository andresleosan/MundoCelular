"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T & (string | number);
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading = false,
  loadingRows = 5,
  emptyTitle = "No hay datos",
  emptyDescription = "No se encontraron resultados.",
  emptyIcon,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const renderCell = (col: Column<T>, row: T): ReactNode => {
    if (col.cell) return col.cell(row);
    if (typeof col.accessor === "function") return col.accessor(row);
    if (col.accessor) return String(row[col.accessor] ?? "");
    return null;
  };

  if (loading) {
    return (
      <div className={cn("rounded-lg border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.header}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(loadingRows)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.header}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        {emptyIcon ?? (
          <PackageOpen className="mb-3 size-10 text-muted-foreground/30" />
        )}
        <p className="text-[15px] font-medium text-muted-foreground">
          {emptyTitle}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground/60">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.header} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={String(row[keyField])}
              className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.header} className={col.className}>
                  {renderCell(col, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
