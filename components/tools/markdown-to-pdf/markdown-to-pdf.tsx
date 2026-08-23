"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MarkdownInputMode,
  MarkdownPdfResult,
  MarkdownPdfSettings,
  PdfPageSize,
} from "@/lib/tools/markdown-to-pdf/types";
import { renderMarkdownOrHtmlToPdf } from "@/lib/tools/markdown-to-pdf/markdown-pdf-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

const SAMPLE_MD = `# Project Specification & Requirements

## Overview
This document outlines the technical architecture and privacy boundaries for the KALVEX platform.

### Core Features
- Local-first document processing in browser RAM
- Zero server persistence of raw document binaries
- Framework-independent Document Bus
- Privacy-hardened AI workspace

### Technical Stack
    Next.js 16 (Turbopack)
    React 19
    Cloudflare Workers (OpenNext)
    PDF-Lib & Tesseract.js

### Privacy Guarantees
- No File or Blob is ever stored in localStorage
- History records only allowlisted metadata
`;

function MarkdownToPdfInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [mode, setMode] = useState<MarkdownInputMode>("markdown");
  const [content, setContent] = useState<string>(SAMPLE_MD);
  const [title, setTitle] = useState<string>("Project Specification");
  const [pageSize, setPageSize] = useState<PdfPageSize>("a4");
  const [state, setState] = useState<"editing" | "rendering" | "success" | "error">("editing");
  const [result, setResult] = useState<MarkdownPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Incoming document transfer
  useEffect(() => {
    if (!artifactParam) return;
    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        if (art.metadata?.text) {
          setContent(art.metadata.text as string);
          setTitle(art.name.replace(/\.[^/.]+$/, ""));
        } else if (art.file instanceof File) {
          art.file.text().then((t) => {
            setContent(t);
            setTitle(art.name.replace(/\.[^/.]+$/, ""));
          });
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [artifactParam]);

  const handleGeneratePdf = async () => {
    if (!content.trim()) return;
    setState("rendering");
    setError(null);

    try {
      const settings: MarkdownPdfSettings = {
        mode,
        pageSize,
        title,
      };

      const res = await renderMarkdownOrHtmlToPdf(content, settings);

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.outputBlob,
        name: res.outputName,
        mimeType: "application/pdf",
        sourceTool: "markdown-to-pdf",
        kind: "pdf",
        metadata: {
          pageCount: res.pageCount,
          durationMs: res.durationMs,
        },
      });

      res.busDocumentId = busDoc.id;

      // Record to History
      historyManager.recordEntry({
        sourceTool: "markdown-to-pdf",
        operationType: "create",
        inputFilename: res.fileName,
        inputKind: "text",
        inputSize: content.length,
        outputFilename: res.outputName,
        outputKind: "pdf",
        outputSize: res.outputSize,
        status: "success",
        outcome: `Rendered ${res.pageCount} ${res.pageCount === 1 ? "Page" : "Pages"} PDF`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
      });

      setResult(res);
      setState("success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate PDF.");
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
          <span className="text-text-primary">Markdown & HTML to PDF</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Convert & Create</Badge>
              <Badge variant="outline">Client Vector Engine</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Markdown & HTML to PDF
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Render technical markdown documentation and HTML code into clean, paginated PDF documents directly in your browser.
            </p>
          </div>
        </div>

        {/* Editor and Settings */}
        {state !== "success" ? (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="rounded-xl border border-border-default bg-surface-base p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title"
                  className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border-default text-text-primary font-bold text-xs"
                />

                <div className="flex gap-1 border border-border-subtle rounded-lg p-0.5 bg-surface-raised">
                  <button
                    onClick={() => setMode("markdown")}
                    className={`px-3 py-1 rounded cursor-pointer ${
                      mode === "markdown" ? "bg-accent text-white font-bold" : "text-text-muted"
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setMode("html")}
                    className={`px-3 py-1 rounded cursor-pointer ${
                      mode === "html" ? "bg-accent text-white font-bold" : "text-text-muted"
                    }`}
                  >
                    HTML
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PdfPageSize)}
                  className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border-default text-text-primary text-xs"
                >
                  <option value="a4">A4 Page</option>
                  <option value="letter">US Letter</option>
                </select>

                <Button
                  variant="primary"
                  onClick={handleGeneratePdf}
                  disabled={state === "rendering"}
                  className="font-bold text-xs"
                >
                  {state === "rendering" ? "Rendering PDF..." : "📄 Export PDF"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs">
                {error}
              </div>
            )}

            {/* Code / Markdown Area */}
            <div className="rounded-xl border border-border-default bg-surface-base p-2 shadow-card">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="w-full p-4 rounded-lg bg-surface-raised/40 font-mono text-xs text-text-primary resize-y focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={mode === "markdown" ? "# Write your Markdown here..." : "<h1>Write your HTML here...</h1>"}
              />
            </div>
          </div>
        ) : (
          result && (
            <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle font-mono">
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase">{result.outputName}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Rendered {result.pageCount} page(s) in {result.durationMs} ms
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={handleDownload} className="font-mono text-xs font-bold">
                    Download PDF File
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                  <span className="text-[10px] text-text-muted uppercase block mb-1">Generated Pages</span>
                  <span className="text-base font-bold text-accent">{result.pageCount}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                  <span className="text-[10px] text-text-muted uppercase block mb-1">PDF File Size</span>
                  <span className="text-base font-bold text-text-primary">{(result.outputSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setState("editing")} className="font-mono text-xs">
                  Edit Document
                </Button>
              </div>
            </div>
          )
        )}
      </Container>
    </div>
  );
}

export function MarkdownToPdf() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading Markdown to PDF...</div>}>
      <MarkdownToPdfInner />
    </Suspense>
  );
}
