"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoiceData, InvoiceItem, InvoiceBuilderResult } from "@/lib/tools/form-generator/types";
import { generateInvoicePdf } from "@/lib/tools/form-generator/invoice-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

const INITIAL_INVOICE: InvoiceData = {
  invoiceNumber: "INV-2026-001",
  date: new Date().toISOString().split("T")[0],
  dueDate: "Net 30 Days",
  currency: "USD ($)",
  sellerName: "KALVEX Studio Inc.",
  sellerAddress: "100 Innovation Way, Suite 400\nSan Francisco, CA 94107",
  sellerEmail: "billing@kalvex.local",
  clientName: "Acme Global Enterprises",
  clientAddress: "750 Corporate Blvd\nNew York, NY 10001",
  clientEmail: "accounts@acme.com",
  items: [
    { id: "1", description: "Document Infrastructure Architecture & Hardening", quantity: 1, unitPrice: 2500.0 },
    { id: "2", description: "Client-Side WASM OCR Engine Integration", quantity: 1, unitPrice: 1800.0 },
    { id: "3", description: "Privacy Boundary Security Verification", quantity: 2, unitPrice: 650.0 },
  ],
  taxRatePercent: 8.5,
  discountPercent: 5.0,
  notes: "Thank you for your business. Payment is due within 30 days via bank wire or credit.",
};

function FormGeneratorInner() {
  const router = useRouter();
  const [data, setData] = useState<InvoiceData>(INITIAL_INVOICE);
  const [state, setState] = useState<"editing" | "generating" | "success" | "error">("editing");
  const [result, setResult] = useState<InvoiceBuilderResult | null>(null);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "New Service or Product",
      quantity: 1,
      unitPrice: 100.0,
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };

  const handleRemoveItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleGenerate = async () => {
    setState("generating");
    try {
      const res = await generateInvoicePdf(data);

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.outputBlob,
        name: res.outputName,
        mimeType: "application/pdf",
        sourceTool: "form-generator",
        kind: "pdf",
        metadata: {
          invoiceNumber: res.invoiceNumber,
          totalAmount: res.totalAmount,
          durationMs: res.durationMs,
        },
      });

      res.busDocumentId = busDoc.id;

      // Log to History
      historyManager.recordEntry({
        sourceTool: "form-generator",
        operationType: "create",
        inputFilename: `Invoice-${data.invoiceNumber}.json`,
        inputKind: "text",
        inputSize: JSON.stringify(data).length,
        outputFilename: res.outputName,
        outputKind: "pdf",
        outputSize: res.outputSize,
        status: "success",
        outcome: `Created Invoice ${res.invoiceNumber} ($${res.totalAmount.toFixed(2)})`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
      });

      setResult(res);
      setState("success");
    } catch (err) {
      console.error("Invoice generation error:", err);
      setState("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link href="/tools" className="hover:text-accent transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-text-primary">Structured Invoice & Form Builder</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Create</Badge>
              <Badge variant="outline">Client Vector Engine</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Structured Invoice & Form Builder
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Generate standard forms, receipts, and invoices with real-time tax and total calculations exported into crisp vector PDFs.
            </p>
          </div>
        </div>

        {state !== "success" ? (
          <div className="space-y-6">
            {/* Form Container */}
            <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card space-y-6 font-mono text-xs">
              {/* Invoice Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-border-subtle">
                <div>
                  <label className="text-text-muted block mb-1 font-bold">Invoice #</label>
                  <input
                    type="text"
                    value={data.invoiceNumber}
                    onChange={(e) => setData({ ...data, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-muted block mb-1 font-bold">Date</label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => setData({ ...data, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-muted block mb-1 font-bold">Due Date / Terms</label>
                  <input
                    type="text"
                    value={data.dueDate}
                    onChange={(e) => setData({ ...data, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-text-muted block mb-1 font-bold">Currency</label>
                  <input
                    type="text"
                    value={data.currency}
                    onChange={(e) => setData({ ...data, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                  />
                </div>
              </div>

              {/* Parties: Seller & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-border-subtle">
                {/* Sender */}
                <div className="space-y-2">
                  <h4 className="font-bold text-text-primary uppercase">From (Seller / Provider)</h4>
                  <input
                    type="text"
                    placeholder="Company or Your Name"
                    value={data.sellerName}
                    onChange={(e) => setData({ ...data, sellerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Email Address"
                    value={data.sellerEmail}
                    onChange={(e) => setData({ ...data, sellerEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                  />
                  <textarea
                    placeholder="Address / Contact"
                    rows={2}
                    value={data.sellerAddress}
                    onChange={(e) => setData({ ...data, sellerAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary resize-none"
                  />
                </div>

                {/* Client */}
                <div className="space-y-2">
                  <h4 className="font-bold text-text-primary uppercase">Bill To (Client)</h4>
                  <input
                    type="text"
                    placeholder="Client Company or Name"
                    value={data.clientName}
                    onChange={(e) => setData({ ...data, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Client Email"
                    value={data.clientEmail}
                    onChange={(e) => setData({ ...data, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                  />
                  <textarea
                    placeholder="Client Address"
                    rows={2}
                    value={data.clientAddress}
                    onChange={(e) => setData({ ...data, clientAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary resize-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pb-6 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-text-primary uppercase">Line Items</h4>
                  <Button variant="secondary" size="sm" onClick={handleAddItem} className="text-xs">
                    + Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {data.items.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-16 px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary text-center"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary text-right"
                      />
                      <div className="w-24 text-right font-bold text-text-primary pr-2">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-text-danger font-bold px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations & Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-text-muted block mb-1 font-bold">Notes / Payment Terms</label>
                  <textarea
                    rows={3}
                    value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary resize-none"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Tax Rate (%):</span>
                    <input
                      type="number"
                      value={data.taxRatePercent}
                      onChange={(e) => setData({ ...data, taxRatePercent: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 rounded bg-surface-raised border border-border-default text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Discount (%):</span>
                    <input
                      type="number"
                      value={data.discountPercent}
                      onChange={(e) => setData({ ...data, discountPercent: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 rounded bg-surface-raised border border-border-default text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-end">
                <Button variant="primary" size="lg" onClick={handleGenerate} className="font-bold text-xs px-8">
                  📄 Generate Vector PDF Invoice
                </Button>
              </div>
            </div>
          </div>
        ) : (
          result && (
            <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card space-y-6 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase">{result.outputName}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Generated in {result.durationMs} ms • Total: ${result.totalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={handleDownload} className="text-xs font-bold">
                    Download Invoice PDF
                  </Button>
                  {result.busDocumentId && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/tools/pdf-optimizer?artifact=${result.busDocumentId}`)}
                      className="text-xs font-bold"
                    >
                      Optimize Stream ➔
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                  <span className="text-[10px] text-text-muted uppercase block mb-1">Invoice Number</span>
                  <span className="text-base font-bold text-accent">{result.invoiceNumber}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                  <span className="text-[10px] text-text-muted uppercase block mb-1">Total Amount</span>
                  <span className="text-base font-bold text-text-primary">${result.totalAmount.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                  <span className="text-[10px] text-text-muted uppercase block mb-1">PDF File Size</span>
                  <span className="text-base font-bold text-text-primary">{(result.outputSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setState("editing")} className="text-xs">
                  Edit Invoice
                </Button>
              </div>
            </div>
          )
        )}
      </Container>
    </div>
  );
}

export function FormGenerator() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading Invoice Builder...</div>}>
      <FormGeneratorInner />
    </Suspense>
  );
}
