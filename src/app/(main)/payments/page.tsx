"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Receipt } from "lucide-react";
import { getMyPayments, downloadReceipt, type Payment } from "@/api/student/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// The student's successful payments, each with its breakdown and a PDF receipt.

const METHOD_LABELS: Record<string, string> = { fonepay: "Fonepay", "esewa-gateway": "eSewa", connectips: "connectIPS" };

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function useReceiptDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const download = async (p: Payment) => {
    setDownloadingId(p._id);
    try {
      await downloadReceipt(p);
    } catch {
      toast({ title: "Couldn't download the receipt", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };
  return { downloadingId, download };
}

export default function PaymentsPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["my-payments"], queryFn: getMyPayments });
  const [selected, setSelected] = useState<Payment | null>(null);
  const { downloadingId, download } = useReceiptDownload();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground">Your successful course payments and receipts.</p>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <InlineError message="Couldn't load your payments." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Receipt className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No payments yet</p>
            <p className="text-xs text-muted-foreground">Courses you buy will appear here with their receipts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <Card key={p._id} className="cursor-pointer transition-colors hover:border-primary" onClick={() => setSelected(p)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                  <Receipt className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{p.courseTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateTime(p.paidAt)} · {METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                    {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-foreground">{money(p.amount)}</p>
                  <p className="text-xs font-medium text-green-600">Paid</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Download receipt"
                  disabled={downloadingId === p._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void download(p);
                  }}
                >
                  {downloadingId === p._id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.courseTitle}</DialogTitle>
                <DialogDescription>
                  Paid {dateTime(selected.paidAt)} with {METHOD_LABELS[selected.paymentMethod] || selected.paymentMethod}
                </DialogDescription>
              </DialogHeader>
              <PaymentBreakdown payment={selected} />
              <div className="space-y-1 text-xs text-muted-foreground">
                {selected.receiptNumber && <p>Receipt no: {selected.receiptNumber}</p>}
                {selected.reference && <p className="break-all">Reference: {selected.reference}</p>}
              </div>
              <Button type="button" className="w-full gap-2" disabled={downloadingId === selected._id} onClick={() => void download(selected)}>
                {downloadingId === selected._id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Download PDF receipt
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentBreakdown({ payment }: { payment: Payment }) {
  const p = payment.pricing;
  const row = (label: string, value: string, opts: { muted?: boolean; strong?: boolean; accent?: boolean } = {}) => (
    <div className={`flex justify-between gap-3 text-sm ${opts.strong ? "font-semibold" : ""}`}>
      <span className={opts.muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={opts.accent ? "text-green-700" : "text-foreground"}>{value}</span>
    </div>
  );
  if (!p) return <div className="rounded-lg border p-3">{row("Total paid", money(payment.amount), { strong: true })}</div>;
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {row("Subtotal", money(p.listPrice))}
      {p.courseDiscountAmount > 0 && row(`Discount (${p.courseDiscountPercent}%)`, `− ${money(p.courseDiscountAmount)}`, { accent: true })}
      {p.codeDiscountAmount > 0 && row(`Code ${p.discountCode ?? ""} (${p.codeDiscountPercent}%)`, `− ${money(p.codeDiscountAmount)}`, { accent: true })}
      {row("Taxable amount", money(p.taxableAmount), { muted: true })}
      {row(`VAT (${p.vatRate}%)`, money(p.vatAmount), { muted: true })}
      <div className="border-t border-border" />
      {row("Total paid", money(payment.amount), { strong: true })}
      <p className="text-xs text-muted-foreground">Prices include VAT.</p>
    </div>
  );
}
