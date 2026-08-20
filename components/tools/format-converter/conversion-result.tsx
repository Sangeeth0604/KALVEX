"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConversionResult as ResultType } from "@/lib/tools/format-converter/types";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";
import { documentBus } from "@/lib/document-bus/document-bus";

interface ConversionResultProps {
  result: ResultType;
  onReset: () => void;
}

export function ConversionResult({ result, onReset }: ConversionResultProps) {
  const router = useRouter();

  const hasMultiplePages = result.pages.length > 1;
  const isReduced = result.sizeDifferenceBytes > 0;
  const isLarger = result.isLarger;
  const diffPercent = Math.abs(result.percentageChange).toFixed(1);

  const handleDownloadSingle = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    result.pages.forEach((page, idx) => {
      setTimeout(() => {
        handleDownloadSingle(page.objectUrl, page.fileName);
      }, idx * 250);
    });
  };

  const compatibleDestinations = documentBus.getCompatibleDestinations(
    result.targetMimeType,
    "format-converter"
  );

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

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2">
              <span>{result.originalName}</span>
              <span className="text-accent">→</span>
              <span className="text-accent">
                .{result.targetExtension.toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 font-mono">
              Converted in {result.durationMs} ms in browser RAM
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isReduced ? (
              <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold">
                ✓ Reduced (-{diffPercent}%)
              </span>
            ) : isLarger ? (
              <span className="text-[11px] font-mono text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle font-semibold">
                Output Larger (+{diffPercent}%)
              </span>
            ) : (
              <span className="text-[11px] font-mono text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle font-semibold">
                Equal Size
              </span>
            )}
          </div>
        </div>

        {/* Size Metrics Comparison Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 font-mono">
          <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-1">
              Original Size
            </span>
            <span className="text-sm sm:text-base font-bold text-text-secondary">
              {formatBytes(result.originalSize)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-1">
              Converted Size
            </span>
            <span className="text-sm sm:text-base font-bold text-text-primary">
              {formatBytes(result.totalOutputSize)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-1">
              Output Format
            </span>
            <span className="text-sm sm:text-base font-bold text-accent uppercase">
              {result.targetExtension}
            </span>
          </div>
        </div>

        {/* Multi-page Converted Grid (if PDF) */}
        {hasMultiplePages && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-text-primary">
                Converted Pages ({result.pages.length})
              </span>
              <button
                type="button"
                onClick={handleDownloadAll}
                className="text-accent hover:underline cursor-pointer"
              >
                Download All ({result.pages.length} Files)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto p-1 scrollbar-thin">
              {result.pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle flex flex-col justify-between text-xs font-mono"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-text-primary">
                      Page {page.pageNumber}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatBytes(page.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadSingle(page.objectUrl, page.fileName)
                    }
                    className="w-full py-1 text-[11px] rounded bg-surface-base border border-border-default hover:border-border-accent text-accent font-bold cursor-pointer transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Hierarchy: Next Operations & Download */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border-subtle">
        {/* Next Operation Bar */}
        {compatibleDestinations.length > 0 && result.busDocumentId && (
          <div className="p-3 rounded-lg bg-surface-raised/60 border border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted uppercase font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Next Operation (In-Memory Handoff):
              </span>
              <span className="text-accent text-[10px]">No re-upload needed</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {compatibleDestinations.map((dest) => (
                <button
                  key={dest.slug}
                  type="button"
                  onClick={() => handleSendToTool(dest.slug)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle ${
                    dest.slug === "ai-workspace"
                      ? "bg-accent-subtle/40 border-border-accent text-accent font-bold hover:bg-accent-subtle"
                      : "bg-surface-base border-border-default hover:border-border-accent hover:text-accent text-text-primary"
                  }`}
                >
                  <span>{dest.slug === "ai-workspace" ? "✨ Open in AI Workspace" : dest.name}</span>
                  <span className="text-accent text-[10px]">➔</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Primary Download and Secondary Reset */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={
              hasMultiplePages
                ? handleDownloadAll
                : () =>
                    handleDownloadSingle(
                      result.pages[0].objectUrl,
                      result.pages[0].fileName
                    )
            }
            className="flex-1 font-bold shadow-subtle font-mono text-xs"
            leftIcon={
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            }
          >
            {hasMultiplePages
              ? `Download All ${result.pages.length} Images (ZIP)`
              : `Download ${result.targetExtension.toUpperCase()} File`}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onReset}
            className="sm:w-auto font-mono text-xs text-text-secondary"
          >
            Convert Another File
          </Button>
        </div>
      </div>
    </div>
  );
}
