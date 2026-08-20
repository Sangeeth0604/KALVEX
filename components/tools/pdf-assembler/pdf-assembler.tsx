"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { UploadZone } from "./upload-zone";
import { PdfWorkspace } from "./pdf-workspace";
import { PdfExportPanel } from "./pdf-export-panel";
import {
  PdfDocumentItem,
  PdfError,
  PdfExportResult,
  PdfPageItem,
  WorkspaceState,
} from "@/lib/tools/pdf-assembler/types";
import {
  generatePdfFromPages,
  loadPdfDocument,
} from "@/lib/tools/pdf-assembler/pdf-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function PdfAssemblerInner() {
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [state, setState] = useState<WorkspaceState>("empty");
  const [documents, setDocuments] = useState<PdfDocumentItem[]>([]);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [exportResult, setExportResult] = useState<PdfExportResult | null>(null);
  const [error, setError] = useState<PdfError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      if (exportResult?.objectUrl) {
        URL.revokeObjectURL(exportResult.objectUrl);
      }
    };
  }, [exportResult]);

  // Handle incoming document from Document Bus via ?artifact=... or ?docId=...
  useEffect(() => {
    if (!artifactParam || documents.length > 0) return;

    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        setState("loading");
        setStatusMessage("Loading transferred PDF document from Document Bus...");
        const fileObj =
          art.file instanceof File
            ? art.file
            : new File([art.file], art.name, { type: "application/pdf" });

        loadPdfDocument(fileObj, 0)
          .then((result) => {
            setDocuments([result.document]);
            setPages(result.pages);
            setState("ready");
            setStatusMessage("");
          })
          .catch((err) => {
            setError(
              (err as PdfError).message !== undefined
                ? (err as PdfError)
                : { code: "CORRUPTED_PDF", message: "Failed to load transferred PDF document." }
            );
            setState("empty");
            setStatusMessage("");
          });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [artifactParam, documents.length]);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    setState("loading");
    setStatusMessage(`Parsing and rendering ${files.length} PDF ${files.length === 1 ? "document" : "documents"}...`);

    try {
      const newDocs: PdfDocumentItem[] = [];
      const newPages: PdfPageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const colorIdx = documents.length + i;
        const result = await loadPdfDocument(files[i], colorIdx);
        newDocs.push(result.document);
        newPages.push(...result.pages);
      }

      setDocuments((prev) => [...prev, ...newDocs]);
      setPages((prev) => [...prev, ...newPages]);
      setState("ready");
      setStatusMessage("");
    } catch (err) {
      const pdfErr: PdfError =
        (err as PdfError).message !== undefined
          ? (err as PdfError)
          : { code: "CORRUPTED_PDF", message: "Failed to parse PDF document." };
      setError(pdfErr);
      setState(documents.length > 0 ? "ready" : "empty");
      setStatusMessage("");
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setPages((prev) => {
      const remaining = prev.filter((p) => p.docId !== docId);
      if (remaining.length === 0) {
        setState("empty");
      }
      return remaining;
    });
  };

  const handleToggleSelectPage = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, isSelected: !p.isSelected } : p))
    );
  };

  const handleSelectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, isSelected: true })));
  };

  const handleClearSelection = () => {
    setPages((prev) => prev.map((p) => ({ ...p, isSelected: false })));
  };

  const handleRotatePage = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleRotateSelected = () => {
    setPages((prev) =>
      prev.map((p) => (p.isSelected ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleMovePage = (pageId: string, direction: "left" | "right") => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === pageId);
      if (idx === -1) return prev;
      const targetIdx = direction === "left" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const newPages = [...prev];
      const temp = newPages[idx];
      newPages[idx] = newPages[targetIdx];
      newPages[targetIdx] = temp;
      return newPages;
    });
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      setError({
        code: "EMPTY_WORKSPACE",
        message: "Cannot delete the last page. Reset the workspace if you wish to start over.",
      });
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  const handleDeleteSelected = () => {
    const selectedCount = pages.filter((p) => p.isSelected).length;
    if (pages.length <= selectedCount) {
      setError({
        code: "EMPTY_WORKSPACE",
        message: "Cannot delete all pages in the workspace. Keep at least one page.",
      });
      return;
    }
    setPages((prev) => prev.filter((p) => !p.isSelected));
  };

  const handleExportAll = async () => {
    if (pages.length === 0) return;

    setState("processing");
    setError(null);
    setStatusMessage("Generating assembled PDF document in browser memory...");

    try {
      if (exportResult?.objectUrl) {
        URL.revokeObjectURL(exportResult.objectUrl);
      }
      const res = await generatePdfFromPages(documents, pages, undefined, "assemble");

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.blob,
        name: res.fileName,
        mimeType: "application/pdf",
        sourceTool: "pdf-assembler",
        kind: "pdf",
        previewUrl: res.objectUrl,
        metadata: {
          pageCount: res.pageCount,
          durationMs: res.durationMs,
          operationType: "assemble",
        },
      });

      res.busDocumentId = busDoc.id;

      // Record into History
      historyManager.recordEntry({
        sourceTool: "pdf-assembler",
        operationType: "assemble",
        inputFilename: documents.map((d) => d.name).join(", "),
        inputKind: "pdf",
        inputSize: documents.reduce((acc, d) => acc + d.size, 0),
        outputFilename: res.fileName,
        outputKind: "pdf",
        outputSize: res.fileSize,
        status: "success",
        outcome: `Assembled ${res.pageCount} Pages (${documents.length} Files)`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
        metadata: {
          pageCount: res.pageCount,
        },
      });

      setExportResult(res);
      setState("success");
      setStatusMessage("");
    } catch (err) {
      const pdfErr: PdfError =
        (err as PdfError).message !== undefined
          ? (err as PdfError)
          : { code: "EXPORT_FAILED", message: "Failed to generate PDF document." };
      setError(pdfErr);
      setState("ready");
      setStatusMessage("");
    }
  };

  const handleExtractSelected = async () => {
    const selectedPages = pages.filter((p) => p.isSelected);
    if (selectedPages.length === 0) return;

    setState("processing");
    setError(null);
    setStatusMessage(`Extracting ${selectedPages.length} selected pages...`);

    try {
      if (exportResult?.objectUrl) {
        URL.revokeObjectURL(exportResult.objectUrl);
      }
      const res = await generatePdfFromPages(documents, selectedPages, undefined, "extract");

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.blob,
        name: res.fileName,
        mimeType: "application/pdf",
        sourceTool: "pdf-assembler",
        kind: "pdf",
        previewUrl: res.objectUrl,
        metadata: {
          pageCount: res.pageCount,
          durationMs: res.durationMs,
          operationType: "extract",
        },
      });

      res.busDocumentId = busDoc.id;

      // Record into History
      historyManager.recordEntry({
        sourceTool: "pdf-assembler",
        operationType: "split",
        inputFilename: documents.map((d) => d.name).join(", "),
        inputKind: "pdf",
        inputSize: documents.reduce((acc, d) => acc + d.size, 0),
        outputFilename: res.fileName,
        outputKind: "pdf",
        outputSize: res.fileSize,
        status: "success",
        outcome: `Extracted ${res.pageCount} Selected Pages`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
        metadata: {
          pageCount: res.pageCount,
        },
      });

      setExportResult(res);
      setState("success");
      setStatusMessage("");
    } catch (err) {
      const pdfErr: PdfError =
        (err as PdfError).message !== undefined
          ? (err as PdfError)
          : { code: "EXPORT_FAILED", message: "Failed to extract pages." };
      setError(pdfErr);
      setState("ready");
      setStatusMessage("");
    }
  };

  const handleReset = useCallback(() => {
    if (exportResult?.objectUrl) {
      URL.revokeObjectURL(exportResult.objectUrl);
    }
    setDocuments([]);
    setPages([]);
    setExportResult(null);
    setError(null);
    setState("empty");
    setStatusMessage("");
  }, [exportResult]);

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link href="/tools" className="hover:text-accent transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-text-primary">PDF Assembler & Splitter</span>
        </div>

        {/* Header & Local Processing Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" dot>
                PROCESSING: LOCAL
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                In-Memory Client Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
              PDF Assembler & Splitter
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Merge multiple PDF documents, reorder sheets, rotate orientations, delete pages, or extract specific ranges locally in your browser memory.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-raised p-3 rounded-lg border border-border-subtle shrink-0">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>In-Memory Browser Execution</span>
          </div>
        </div>

        {/* In-UI Error Alert */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-error-subtle/50 border border-error text-error text-xs font-mono flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm">✕</span>
              <span>{error.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs underline cursor-pointer hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Empty Upload State */}
        {state === "empty" && (
          <div className="max-w-3xl mx-auto">
            <UploadZone
              documents={documents}
              onFilesSelected={handleFilesSelected}
              onRemoveDocument={handleRemoveDocument}
              onError={(err) => {
                setError(err);
                setState("empty");
              }}
            />
          </div>
        )}

        {/* Loading Documents State */}
        {state === "loading" && (
          <div className="max-w-xl mx-auto p-12 rounded-xl border border-border-default bg-surface-base text-center shadow-card">
            <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-base font-mono font-bold text-text-primary mb-1">
              Loading PDF Workspace...
            </h3>
            <p className="text-xs text-text-muted font-mono">{statusMessage}</p>
          </div>
        )}

        {/* Processing State */}
        {state === "processing" && (
          <div className="max-w-xl mx-auto p-12 rounded-xl border border-border-default bg-surface-base text-center shadow-card">
            <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-base font-mono font-bold text-text-primary mb-1">
              Processing PDF Pages...
            </h3>
            <p className="text-xs text-text-muted font-mono">{statusMessage}</p>
          </div>
        )}

        {/* Ready / Workspace Active State */}
        {state === "ready" && (
          <>
            <UploadZone
              documents={documents}
              onFilesSelected={handleFilesSelected}
              onRemoveDocument={handleRemoveDocument}
              onError={(err) => setError(err)}
              compact
              disabled={false}
            />
            <PdfWorkspace
              pages={pages}
              onToggleSelectPage={handleToggleSelectPage}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onRotatePage={handleRotatePage}
              onRotateSelected={handleRotateSelected}
              onMovePageLeft={(id) => handleMovePage(id, "left")}
              onMovePageRight={(id) => handleMovePage(id, "right")}
              onDeletePage={handleDeletePage}
              onDeleteSelected={handleDeleteSelected}
              onExportAll={handleExportAll}
              onExtractSelected={handleExtractSelected}
              isProcessing={false}
            />
          </>
        )}

        {/* Success / Export Result Panel */}
        {state === "success" && exportResult && (
          <PdfExportPanel
            result={exportResult}
            onReset={handleReset}
            onBackToWorkspace={() => setState("ready")}
          />
        )}
      </Container>
    </div>
  );
}

export function PdfAssembler() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-text-muted">
          Loading assembler...
        </div>
      }
    >
      <PdfAssemblerInner />
    </Suspense>
  );
}
