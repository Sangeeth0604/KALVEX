"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OcrResult } from "@/lib/tools/ocr-extractor/types";
import { documentBus } from "@/lib/document-bus/document-bus";

interface OcrResultViewerProps {
  result: OcrResult;
  onReset: () => void;
}

export function OcrResultViewer({ result, onReset }: OcrResultViewerProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | "all">("all");

  const hasMultiplePages = result.pages.length > 1;

  const currentDisplayText =
    selectedPageIndex === "all"
      ? result.fullText
      : result.pages[selectedPageIndex]?.text || "";

  const hasText = result.fullText.trim().length > 0;

  const handleCopy = async () => {
    if (!currentDisplayText) return;
    try {
      await navigator.clipboard.writeText(currentDisplayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadTxt = () => {
    if (!result.fullText) return;
    const blob = new Blob([result.fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = result.fileName.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}-extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInAiWorkspace = () => {
    if (!result.busDocumentId) return;
    const art = documentBus.getArtifact(result.busDocumentId);
    if (!art) return;
    router.push(`/ai-workspace?artifact=${art.id}`);
  };

  const handleSendToTool = (targetSlug: string) => {
    if (!result.busDocumentId) return;
    const art = documentBus.getArtifact(result.busDocumentId);
    if (!art) return;
    const targetUrl =
      targetSlug === "ai-workspace"
        ? `/ai-workspace?artifact=${art.id}`
        : `/tools/${targetSlug}?artifact=${art.id}`;
    router.push(targetUrl);
  };

  const compatibleDestinations = documentBus.getCompatibleDestinations(
    result.inputType === "pdf" ? "application/pdf" : "image/jpeg",
    "ocr-extractor"
  );

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Extracted Text Results
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Extracted in {(result.durationMs / 1000).toFixed(2)}s via browser WASM engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasText ? (
              <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold">
                ✓ {result.averageConfidence}% Confidence
              </span>
            ) : (
              <span className="text-[11px] font-mono text-warning bg-warning-subtle px-2.5 py-0.5 rounded border border-border-default font-semibold">
                No Text Detected
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-0.5">Words</span>
            <span className="text-text-primary font-bold">{result.totalWords}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-0.5">Lines</span>
            <span className="text-text-primary font-bold">{result.totalLines}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-0.5">Pages</span>
            <span className="text-text-primary font-bold">{result.totalPages}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-0.5">Confidence</span>
            <span className="text-accent font-bold">{result.averageConfidence}%</span>
          </div>
        </div>

        {/* Multi-page Navigation Tabs if PDF has > 1 page */}
        {hasMultiplePages && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-border-subtle scrollbar-none text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedPageIndex("all")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedPageIndex === "all"
                  ? "bg-surface-raised text-accent border border-border-accent font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              }`}
            >
              Full Document
            </button>

            {result.pages.map((p, idx) => (
              <button
                key={p.pageNumber}
                type="button"
                onClick={() => setSelectedPageIndex(idx)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  selectedPageIndex === idx
                    ? "bg-surface-raised text-accent border border-border-accent font-bold"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                Page {p.pageNumber} ({p.confidence}%)
              </button>
            ))}
          </div>
        )}

        {/* Text Content Viewer */}
        {hasText ? (
          <div className="relative mb-5">
            <textarea
              readOnly
              value={currentDisplayText}
              rows={12}
              className="w-full p-4 rounded-lg bg-surface-raised border border-border-subtle font-mono text-xs text-text-primary leading-relaxed resize-y focus:outline-none focus:border-border-accent"
              aria-label="Extracted OCR Text Content"
            />
          </div>
        ) : (
          <div className="p-8 rounded-lg bg-surface-raised border border-border-subtle text-center text-xs font-mono text-text-muted my-6 space-y-2">
            <p className="font-bold text-text-secondary">No legible characters detected.</p>
            <p className="text-[11px] max-w-sm mx-auto">
              The engine could not recognize alphanumeric text in this document. Ensure the file has adequate lighting, resolution, and text contrast.
            </p>
          </div>
        )}
      </div>

      {/* Action Hierarchy: Next Intelligence Operations & Export */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border-subtle">
        {/* Next Operation: AI Intelligence Handoff */}
        {hasText && result.busDocumentId && (
          <div className="p-3.5 rounded-lg bg-surface-raised/60 border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted uppercase font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Next Operation (Document Intelligence):
              </span>
              <span className="text-accent text-[10px]">Zero re-upload needed</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenInAiWorkspace}
                className="font-mono text-xs font-bold shadow-subtle flex items-center gap-1.5"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Open in AI Workspace ➔
              </Button>

              {compatibleDestinations
                .filter((d) => d.slug !== "ai-workspace")
                .map((dest) => (
                  <button
                    key={dest.slug}
                    type="button"
                    onClick={() => handleSendToTool(dest.slug)}
                    className="px-3 py-2 rounded-lg bg-surface-base border border-border-default hover:border-border-accent hover:text-accent text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
                  >
                    <span>{dest.name}</span>
                    <span className="text-accent text-[10px]">➔</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Export & Reset Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {hasText && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleCopy}
                className="flex-1 font-bold font-mono text-xs min-w-[160px]"
                leftIcon={
                  copied ? (
                    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )
                }
              >
                {copied ? "Copied to Clipboard!" : "Copy Extracted Text"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadTxt}
                className="font-mono text-xs"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Download .TXT
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={onReset}
            className="sm:w-auto font-mono text-xs text-text-secondary"
          >
            Extract Another Document
          </Button>
        </div>
      </div>
    </div>
  );
}
