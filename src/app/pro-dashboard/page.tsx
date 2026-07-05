"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  FileText, 
  HelpCircle, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { Invoice } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";


function ProDashboardContent() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<"connectips" | "esewa" | "khalti">("connectips");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const loadInvoices = async () => {
    const res = await api.getInvoices();
    if (res.success && res.data) {
      setInvoices(res.data);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePayConfirm = async () => {
    if (!selectedInvoice) return;
    setIsProcessingPayment(true);
    
    // Simulate payment latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const res = await api.payInvoice(selectedInvoice.id);
    setIsProcessingPayment(false);
    
    if (res.success) {
      toast({
        title: "Payment Verified",
        description: `Successfully paid Rs. ${selectedInvoice.amount} via ${paymentGateway.toUpperCase()}.`,
      });
      setSelectedInvoice(null);
      loadInvoices();
    }
  };

  const pendingInvoices = invoices.filter(inv => inv.status === "pending");
  const totalPaid = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Banner */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-gray-300 shadow-sm bg-white p-5 flex gap-4 items-center">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Pending Invoices</span>
            <span className="text-xl font-extrabold text-gray-800">
              {pendingInvoices.length} Dues
            </span>
          </div>
        </Card>

        <Card className="border border-gray-300 shadow-sm bg-white p-5 flex gap-4 items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Total Fees Paid</span>
            <span className="text-xl font-extrabold text-green-600">
              Rs. {totalPaid.toLocaleString()}
            </span>
          </div>
        </Card>
      </div>

      {/* Pro Membership info */}
      <Card className="border border-gray-300 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-0.5 rounded-full">
              Upgrade Package
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold leading-tight">NoteSwift Pro Access</h2>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
            Unlock all courses, 1-on-1 teacher doubt solving channels, automated study calendars, and download full mock test papers with step-by-step review keys.
          </p>
          <div className="flex items-baseline gap-1 text-2xl font-extrabold">
            <span>Rs. 2,999</span>
            <span className="text-xs text-indigo-200 font-semibold">/ academic term</span>
          </div>
        </div>
      </Card>

      {/* Dues and Invoices */}
      <Card className="border-gray-300 shadow-sm bg-white">
        <CardHeader className="border-b border-gray-300 pb-4">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            Fees Billing & Receipts
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">Manage your subscription packages, invoice details, and secure checkout receipts.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                className="flex items-center justify-between p-4 border border-gray-250 rounded-2xl bg-white hover:bg-gray-50/50 transition-colors flex-wrap gap-4"
              >
                <div className="flex gap-4 items-center">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-xl shrink-0 ${
                    inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-gray-800 leading-snug">{inv.description}</h4>
                    <p className="text-[10px] font-semibold text-gray-400">
                      ID: {inv.id} • Due: {inv.dueDate}
                      {inv.datePaid && ` • Paid: ${inv.datePaid}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0">
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-gray-800 block">Rs. {inv.amount.toLocaleString()}</span>
                    <Badge 
                      variant={inv.status === "paid" ? "secondary" : "destructive"} 
                      className={`text-[8px] font-extrabold uppercase mt-0.5 ${
                        inv.status === "paid" ? "bg-green-50 text-green-700 hover:bg-green-50" : "bg-red-50 text-red-700 hover:bg-red-50"
                      }`}
                    >
                      {inv.status}
                    </Badge>
                  </div>

                  {inv.status === "pending" && (
                    <Button 
                      onClick={() => setSelectedInvoice(inv)}
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-9 text-xs px-4"
                    >
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CHECKOUT PAYMENT DIALOG */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-300 p-6 rounded-3xl space-y-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Secure Checkout Portal
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-semibold leading-relaxed">
              Nepal digital payment integrations.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/50 space-y-1.5">
              <span className="text-[9px] text-blue-600 font-extrabold uppercase block">Invoice Detail</span>
              <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">{selectedInvoice.description}</h4>
              <p className="text-sm font-extrabold text-blue-700 pt-1">Rs. {selectedInvoice.amount.toLocaleString()}</p>
            </div>
          )}

          {/* Payment gateway options */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-650">Select Payment Gateway</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "connectips", name: "connectIPS", color: "hover:border-red-400 bg-red-50/30" },
                { id: "esewa", name: "eSewa", color: "hover:border-green-400 bg-green-50/30" },
                { id: "khalti", name: "Khalti", color: "hover:border-purple-400 bg-purple-50/30" }
              ].map((gateway) => (
                <div 
                  key={gateway.id} 
                  onClick={() => setPaymentGateway(gateway.id as any)}
                  className={`border-2 rounded-2xl p-3 text-center cursor-pointer transition-all ${
                    paymentGateway === gateway.id 
                      ? "border-blue-600 bg-blue-50/30 font-bold" 
                      : "border-gray-250 text-gray-600 font-semibold"
                  } ${gateway.color}`}
                >
                  <span className="text-xs sm:text-sm block">{gateway.name}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2">
            <Button 
              onClick={handlePayConfirm} 
              disabled={isProcessingPayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs"
            >
              {isProcessingPayment ? "Verifying Transaction..." : "Confirm & Pay"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedInvoice(null)}
              className="border-gray-300 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProDashboardPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <ProDashboardContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
