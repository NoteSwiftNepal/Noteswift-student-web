import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toCSV(rows: any[], headers?: string[]): string {
  if (!rows || rows.length === 0) return '';
  const keys = headers && headers.length ? headers : Object.keys(rows[0]);
  const escape = (val: any) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const head = keys.join(',');
  const body = rows.map(r => keys.map(k => escape(r[k])).join(',')).join('\n');
  return head + '\n' + body;
}
