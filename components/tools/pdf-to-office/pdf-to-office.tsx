"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OfficeConversionResult,
  OfficeConversionSettings,
  OfficeTargetFormat,
} from "@/lib/tools/pdf-to-office/types";
import { convertPdfToOffice } from "@/lib/tools/pdf-to-office/office-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function PdfToOfficeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<OfficeTargetFormat>("docx");
  const [state, setState] = useState<"empty" | "ready" | "converting" | "success" | "error">("empty");
  const [result, setResult] = useState<OfficeConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setState("ready");
  }, []);

  useEffect(() => {
    if (!artifactParam || file) return;
    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        const fileObj =
          art.file instanceof File
            ? art.file
            : new File([art.file], art.name, { type: art.mimeType });
        handleFileSelect(fileObj);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [artifactParam, file, handleFileSelect]);

  const handleConvert = async () => {
    if (!file) return;
    setState("converting");
    setError(null);

    try {
      const settings: OfficeConversionSettings = {
        targetFormat,
        preservePageBreaks: true,
      };

      const res = await convertPdfToOffice(file, settings);

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.outputBlob,
        name: res.outputName,
        mimeType: res.outputBlob.type,
        sourceTool: "pdf-to-office",
        kind: "text",
        metadata: {
          format: res.targetFormat,
          wordCount: res.wordCount,
          tableCount: res.tableCount,
          durationMs: res.durationMs,
        },
      });

      res.busDocumentId = busDoc.id;

      // Log to History
      historyManager.recordEntry({
        sourceTool: "pdf-to-office",
        operationType: "convert",
        inputFilename: file.name,
        inputKind: "pdf",
        inputSize: file.size,
        outputFilename: res.outputName,
        outputKind: "text",
        outputSize: res.outputSize,
        status: "success",
        outcome: `Converted to ${res.targetFormat.toUpperCase()} (${res.pageCount} Pages, ${res.wordCount.toLocaleString()} Words)`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
      });

      setResult(res);
      setState("success");
    } catch (err) {
      console.error("PDF to Office conversion failed:", err);
      setError(err instanceof Error ? err.message : "Failed to convert PDF.");
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
          <span className="text-text-primary">PDF to Office Formats</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Convert</Badge>
              <Badge variant="outline">Client Engine</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              PDF to Office Formats
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Transform PDF documents into editable Word (.docx) documents and Excel (.xlsx) spreadsheets with layout and table retention.
            </p>
          </div>
        </div>

        {state === "empty" && (
          <div className="rounded-xl border border-dashed border-border-default p-12 text-center bg-surface-raised/40">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary font-mono">Upload PDF to Convert</h3>
              <p className="text-xs text-text-muted font-mono">
                Select a PDF document to transform into an editable Word (.docx) or Excel (.xlsx) file.
              </p>
              <input
                type="file"
                id="office-pdf-input"
                className="hidden"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById("office-pdf-input")?.click()}
                className="font-mono text-xs font-bold"
              >
                Choose PDF Document
              </Button>
            </div>
          </div>
        )}

        {state === "ready" && file && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border border-border-default bg-surface-base p-6 space-y-6">
              <h3 className="text-sm font-bold font-mono text-text-primary uppercase border-b border-border-subtle pb-3">
                Target Office Format
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTargetFormat("docx")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    targetFormat === "docx"
                      ? "border-accent bg-accent-subtle/30 shadow-subtle"
                      : "border-border-default bg-surface-raised/40 hover:border-border-accent"
                  }`}
                >
                  <span className="text-sm font-bold font-mono text-text-primary block">Word Document (.DOCX)</span>
                  <span className="text-xs text-text-muted mt-1 block">Best for text documents, reports, and contracts.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetFormat("xlsx")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    targetFormat === "xlsx"
                      ? "border-accent bg-accent-subtle/30 shadow-subtle"
                      : "border-border-default bg-surface-raised/40 hover:border-border-accent"
                  }`}
                >
                  <span className="text-sm font-bold font-mono text-text-primary block">Excel Spreadsheet (.XLSX)</span>
                  <span className="text-xs text-text-muted mt-1 block">Best for invoices, statements, and tabular data.</span>
                </button>
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-end">
                <Button variant="primary" onClick={handleConvert} className="font-mono text-xs font-bold px-8">
                  Convert to {targetFormat.toUpperCase()} ➔
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border-default bg-surface-base p-6 space-y-4 font-mono text-xs">
              <h3 className="font-bold text-text-primary uppercase border-b border-border-subtle pb-2">Source PDF</h3>
              <div className="space-y-2 text-text-muted">
                <div>Name: <span className="text-text-primary font-bold">{file.name}</span></div>
                <div>Size: <span className="text-text-primary font-bold">{(file.size / 1024).toFixed(1)} KB</span></div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="w-full text-xs">
                Choose Different PDF
              </Button>
            </div>
          </div>
        )}

        {state === "converting" && (
          <div className="rounded-xl border border-border-default bg-surface-base p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mb-4" />
            <p className="text-sm font-mono font-bold text-text-primary">Extracting PDF structures and building {targetFormat.toUpperCase()} document...</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-xl border border-border-danger bg-surface-base p-8 text-center space-y-4">
            <p className="text-sm font-mono text-text-danger font-bold">{error || "Conversion failed."}</p>
            <Button variant="secondary" onClick={() => setState("ready")} className="font-mono text-xs">
              Try Again
            </Button>
          </div>
        )}

        {state === "success" && result && (
          <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle font-mono">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase">{result.outputName}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Converted in {result.durationMs} ms • {result.pageCount} Pages • {result.wordCount.toLocaleString()} Words
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={handleDownload} className="font-mono text-xs font-bold">
                  Download {result.targetFormat.toUpperCase()} File
                </Button>
                {result.busDocumentId && (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/ai-workspace?artifact=${result.busDocumentId}`)}
                    className="font-mono text-xs font-bold"
                  >
                    ✨ Open in AI Workspace ➔
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Target Format</span>
                <span className="text-base font-bold text-accent uppercase">.{result.targetFormat}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Extracted Tables</span>
                <span className="text-base font-bold text-text-primary">{result.tableCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Output Size</span>
                <span className="text-base font-bold text-text-primary">{(result.outputSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="font-mono text-xs">
                Convert Another PDF
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export function PdfToOffice() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading PDF to Office...</div>}>
      <PdfToOfficeInner />
    </Suspense>
  );
}
