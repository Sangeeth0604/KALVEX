"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiffSummary, DiffError } from "@/lib/tools/diff-analyzer/types";
import {
  extractDocumentText,
  compareDocumentTexts,
  generateDiffReportBlob,
} from "@/lib/tools/diff-analyzer/diff-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function DiffAnalyzerInner() {
  const router = useRouter();
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [state, setState] = useState<"empty" | "analyzing" | "diffed" | "error">("empty");
  const [summary, setSummary] = useState<DiffSummary | null>(null);
  const [error, setError] = useState<DiffError | null>(null);

  const handleRunDiff = async () => {
    if (!fileA || !fileB) return;
    setState("analyzing");
    setError(null);

    try {
      const [textA, textB] = await Promise.all([
        extractDocumentText(fileA),
        extractDocumentText(fileB),
      ]);

      const diffResult = compareDocumentTexts(textA, textB, fileA, fileB);
      const reportBlob = generateDiffReportBlob(diffResult);

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: reportBlob,
        name: `diff-${fileA.name}-vs-${fileB.name}.md`,
        mimeType: "text/markdown",
        sourceTool: "diff-analyzer",
        kind: "text",
        metadata: {
          fileA: fileA.name,
          fileB: fileB.name,
          additions: diffResult.additionsCount,
          deletions: diffResult.deletionsCount,
          similarity: diffResult.similarityScore,
          durationMs: diffResult.durationMs,
        },
      });

      diffResult.busDocumentId = busDoc.id;

      // Record to History
      historyManager.recordEntry({
        sourceTool: "diff-analyzer",
        operationType: "diff",
        inputFilename: `${fileA.name} ↔ ${fileB.name}`,
        inputKind: "text",
        inputSize: fileA.size + fileB.size,
        outputFilename: `diff-${fileA.name}-vs-${fileB.name}.md`,
        outputKind: "text",
        outputSize: reportBlob.size,
        status: "success",
        outcome: `Diff: +${diffResult.additionsCount} / -${diffResult.deletionsCount} (${(diffResult.similarityScore * 100).toFixed(0)}% match)`,
        durationMs: diffResult.durationMs,
        busArtifactId: busDoc.id,
      });

      setSummary(diffResult);
      setState("diffed");
    } catch (err) {
      console.error("Diff comparison error:", err);
      const errMsg =
        err instanceof Error ? err.message : "Failed to compare document contents.";
      setError({ code: "DIFF_FAILED", message: errMsg });
      setState("error");
    }
  };

  const handleDownloadReport = () => {
    if (!summary) return;
    const blob = generateDiffReportBlob(summary);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diff-${summary.fileAName}-vs-${summary.fileBName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendToAi = () => {
    if (!summary?.busDocumentId) return;
    router.push(`/ai-workspace?artifact=${summary.busDocumentId}`);
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
          <span className="text-text-primary">Document Difference Analyzer</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Understand</Badge>
              <Badge variant="outline">Client Engine</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Document Difference Analyzer
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Compare two PDF or text document revisions side-by-side to highlight textual modifications, additions, and deletions.
            </p>
          </div>
        </div>

        {/* File Selection Mode */}
        {state === "empty" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File A */}
            <div className="rounded-xl border border-border-default bg-surface-base p-6 text-center space-y-4">
              <h3 className="text-sm font-bold font-mono text-text-primary uppercase">Original Document (Version A)</h3>
              {fileA ? (
                <div className="p-4 rounded-lg bg-surface-raised border border-border-subtle font-mono text-xs text-text-primary flex items-center justify-between">
                  <span>{fileA.name}</span>
                  <button onClick={() => setFileA(null)} className="text-text-danger font-bold">✕</button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="fileA-input"
                    className="hidden"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setFileA(e.target.files?.[0] || null)}
                  />
                  <Button variant="secondary" onClick={() => document.getElementById("fileA-input")?.click()} className="font-mono text-xs">
                    Choose Version A
                  </Button>
                </div>
              )}
            </div>

            {/* File B */}
            <div className="rounded-xl border border-border-default bg-surface-base p-6 text-center space-y-4">
              <h3 className="text-sm font-bold font-mono text-text-primary uppercase">Revised Document (Version B)</h3>
              {fileB ? (
                <div className="p-4 rounded-lg bg-surface-raised border border-border-subtle font-mono text-xs text-text-primary flex items-center justify-between">
                  <span>{fileB.name}</span>
                  <button onClick={() => setFileB(null)} className="text-text-danger font-bold">✕</button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="fileB-input"
                    className="hidden"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setFileB(e.target.files?.[0] || null)}
                  />
                  <Button variant="secondary" onClick={() => document.getElementById("fileB-input")?.click()} className="font-mono text-xs">
                    Choose Version B
                  </Button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 text-center pt-4">
              <Button
                variant="primary"
                size="lg"
                disabled={!fileA || !fileB}
                onClick={handleRunDiff}
                className="font-mono text-xs font-bold px-8"
              >
                Compare Documents
              </Button>
            </div>
          </div>
        )}

        {state === "analyzing" && (
          <div className="rounded-xl border border-border-default bg-surface-base p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mb-4" />
            <p className="text-sm font-mono font-bold text-text-primary">Extracting text & running Myers diff comparison...</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-xl border border-border-danger bg-surface-base p-8 text-center space-y-4">
            <p className="text-sm font-mono text-text-danger font-bold">{error?.message || "Diff failed."}</p>
            <Button variant="secondary" onClick={() => setState("empty")} className="font-mono text-xs">
              Try Again
            </Button>
          </div>
        )}

        {state === "diffed" && summary && (
          <div className="space-y-6">
            {/* Metrics Ribbon */}
            <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle font-mono">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {summary.fileAName} <span className="text-accent">↔</span> {summary.fileBName}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Similarity: {(summary.similarityScore * 100).toFixed(1)}% • Compared in {summary.durationMs} ms
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-green-500/10 text-green-400 font-bold border border-green-500/20">
                    +{summary.additionsCount} Additions
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                    -{summary.deletionsCount} Deletions
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleDownloadReport} className="text-xs">
                    Download Report (.MD)
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSendToAi} className="text-xs font-bold">
                    ✨ Open in AI Workspace ➔
                  </Button>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("unified")}
                    className={`px-3 py-1 text-xs font-mono rounded border cursor-pointer ${
                      viewMode === "unified"
                        ? "bg-accent text-white border-accent"
                        : "bg-surface-raised text-text-muted border-border-subtle"
                    }`}
                  >
                    Unified Diff
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-3 py-1 text-xs font-mono rounded border cursor-pointer ${
                      viewMode === "split"
                        ? "bg-accent text-white border-accent"
                        : "bg-surface-raised text-text-muted border-border-subtle"
                    }`}
                  >
                    Side-by-Side
                  </button>
                </div>

                <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="font-mono text-xs">
                  Compare Other Files
                </Button>
              </div>

              {/* Diff Content Box */}
              <div className="mt-4 border border-border-subtle rounded-lg max-h-[550px] overflow-y-auto font-mono text-xs bg-surface-raised/30">
                {viewMode === "unified" ? (
                  <div className="p-3 space-y-0.5">
                    {summary.diffLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded flex items-start gap-3 ${
                          line.type === "added"
                            ? "bg-green-500/15 text-green-300 font-semibold"
                            : line.type === "removed"
                            ? "bg-red-500/15 text-red-300 font-semibold"
                            : "text-text-muted"
                        }`}
                      >
                        <span className="w-6 text-right select-none opacity-50">
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                        </span>
                        <span className="w-8 text-right select-none opacity-40">
                          {line.lineNumA || line.lineNumB || ""}
                        </span>
                        <span className="whitespace-pre-wrap flex-1 break-all">{line.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 divide-x divide-border-subtle">
                    {/* Column A (Original) */}
                    <div className="p-3 space-y-0.5">
                      <div className="text-[11px] font-bold text-text-muted pb-2 border-b border-border-subtle mb-2 uppercase">
                        Version A: {summary.fileAName}
                      </div>
                      {summary.diffLines
                        .filter((l) => l.type !== "added")
                        .map((line, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded ${
                              line.type === "removed" ? "bg-red-500/15 text-red-300" : "text-text-muted"
                            }`}
                          >
                            <span className="select-none opacity-40 mr-2">{line.lineNumA || ""}</span>
                            <span>{line.text}</span>
                          </div>
                        ))}
                    </div>

                    {/* Column B (Revised) */}
                    <div className="p-3 space-y-0.5">
                      <div className="text-[11px] font-bold text-text-muted pb-2 border-b border-border-subtle mb-2 uppercase">
                        Version B: {summary.fileBName}
                      </div>
                      {summary.diffLines
                        .filter((l) => l.type !== "removed")
                        .map((line, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded ${
                              line.type === "added" ? "bg-green-500/15 text-green-300" : "text-text-muted"
                            }`}
                          >
                            <span className="select-none opacity-40 mr-2">{line.lineNumB || ""}</span>
                            <span>{line.text}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export function DiffAnalyzer() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading Diff Analyzer...</div>}>
      <DiffAnalyzerInner />
    </Suspense>
  );
}
