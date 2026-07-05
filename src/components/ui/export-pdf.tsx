"use client";

export function ExportPDFButton({ filename, html, label = "Export PDF" }: { filename: string; html: string; label?: string; }) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
      onClick={() => {
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`<!doctype html><html><head><title>${filename}</title></head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        win.print();
      }}
    >
      {label}
    </button>
  );
}
