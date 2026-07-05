"use client";

import { toCSV } from "@/lib/utils";

export function ExportCSVButton({ filename, rows, headers, label = "Export CSV" }: { filename: string; rows: any[]; headers?: string[]; label?: string; }) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      onClick={() => {
        const csv = toCSV(rows, headers);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }}
    >
      {label}
    </button>
  );
}
