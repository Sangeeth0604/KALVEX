"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OptimizationResult as ResultType } from "@/lib/tools/pdf-optimizer/types";
import { formatBytes } from "@/lib/tools/pdf-optimizer/pdf-engine";
import { documentBus } from "@/lib/document-bus/document-bus";

interface OptimizationResultProps {
  result: ResultType;
  onReset: () => void;
}

export function OptimizationResult({
  result,
  onReset,
}: OptimizationResultProps) {
  const router = useRouter();
  const [showSendMenu, setShowSendMenu] = useState(false);

  const isReduced = result.outcome === "reduced";
  const isEqual = result.outcome === "equal";
  const isLarger = result.outcome === "larger";

  const sizeDiffBytes = Math.abs(result.reductionBytes);
  const sizeDiffPercent = Math.abs(result.savingsPercentage).toFixed(1);

  const handleDownloadEffective = () => {
    const a = document.createElement("a");
    a.href = result.effectiveObjectUrl;
    a.download = result.effectiveFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadCandidate = () => {
    const a = document.createElement("a");
    a.href = result.candidateObjectUrl;
    a.download = result.candidateFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const compatibleDestinations = documentBus.getCompatibleDestinations(
    "application/pdf",
    "pdf-optimizer"
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
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Optimization Results
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Processed in {result.durationMs} ms in browser RAM
            </p>
          </div>

          {isReduced && (
            <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold">
              ✓ Reduced (-{sizeDiffPercent}%)
            </span>
          )}

          {isEqual && (
            <span className="text-[11px] font-mono text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle font-semibold">
              No Reduction (0% Savings)
            </span>
          )}

          {isLarger && (
            <span className="text-[11px] font-mono text-warning bg-warning-subtle px-2.5 py-0.5 rounded border border-border-default font-semibold">
              ⚠ Output Larger (+{sizeDiffPercent}%)
            </span>
          )}
        </div>

        {/* Explanatory Callout Banner when Re-encoding produced larger output */}
        {isLarger && (
          <div className="mb-6 p-4 rounded-lg bg-surface-raised border border-border-default text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-text-primary">
              <span className="text-warning">⚠</span>
              <span>Re-Encoding Produced Larger Output</span>
            </div>
            <p className="text-text-secondary font-sans">
              Re-encoding produced a file that is{" "}
              <strong className="text-text-primary font-mono">{formatBytes(sizeDiffBytes)}</strong>{" "}
              (+{sizeDiffPercent}%) larger than the original ({formatBytes(result.originalSize)}).
              Because the document object tree was already highly compressed, KALVEX preserved your original
              PDF to prevent file bloat.
            </p>
          </div>
        )}

        {isEqual && (
          <div className="mb-6 p-4 rounded-lg bg-surface-raised border border-border-default text-xs leading-relaxed">
            <p className="text-text-secondary font-sans">
              The optimized document is identical in size to the original file (
              {formatBytes(result.originalSize)}). No byte reduction was achieved.
            </p>
          </div>
        )}

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
              {isReduced ? "Optimized Size" : "Candidate Size"}
            </span>
            <span
              className={`text-sm sm:text-base font-bold ${
                isReduced ? "text-text-primary" : isLarger ? "text-warning" : "text-text-secondary"
              }`}
            >
              {formatBytes(result.optimizedSize)}
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border text-center ${
              isReduced
                ? "bg-accent-subtle/30 border-border-accent-subtle"
                : isLarger
                ? "bg-warning-subtle/20 border-border-default"
                : "bg-surface-raised border-border-subtle"
            }`}
          >
            <span
              className={`text-[10px] uppercase block mb-1 font-semibold ${
                isReduced ? "text-accent" : isLarger ? "text-warning" : "text-text-muted"
              }`}
            >
              {isReduced ? "Savings" : isLarger ? "Size Increase" : "Savings"}
            </span>
            <span
              className={`text-sm sm:text-base font-bold ${
                isReduced
                  ? "text-accent"
                  : isLarger
                  ? "text-warning"
                  : "text-text-muted"
              }`}
            >
              {isReduced
                ? `-${sizeDiffPercent}%`
                : isLarger
                ? `+${sizeDiffPercent}%`
                : "0%"}
            </span>
          </div>
        </div>

        {/* PDF Specs Details */}
        <div className="p-3 rounded-lg bg-surface-raised/50 border border-border-subtle mb-6 text-xs font-mono text-text-muted space-y-1.5">
          <div className="flex justify-between">
            <span>Recommended File:</span>
            <span className="text-text-primary font-bold truncate max-w-[220px]">
              {result.effectiveFileName}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Page Count:</span>
            <span className="text-text-primary">
              {result.pageCount} {result.pageCount === 1 ? "Page" : "Pages"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Architecture:</span>
            <span className="text-text-primary">
              Object Streams (PDF 1.5+)
            </span>
          </div>
          <div className="flex justify-between">
            <span>Net Result:</span>
            <span
              className={
                isReduced
                  ? "text-accent font-bold"
                  : isLarger
                  ? "text-warning font-bold"
                  : "text-text-muted font-medium"
              }
            >
              {isReduced
                ? `Saved ${formatBytes(result.reductionBytes)} (-${sizeDiffPercent}%)`
                : isLarger
                ? `+${formatBytes(sizeDiffBytes)} (Original Preserved)`
                : "0 Bytes (0%)"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons & Document Bus Bridge */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownloadEffective}
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
            {isReduced
              ? "Download Optimized PDF"
              : isLarger
              ? "Download Original (Preserved)"
              : "Download PDF"}
          </Button>

          {/* Document Bus Send to menu */}
          {compatibleDestinations.length > 0 && result.busDocumentId && (
            <div className="relative">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowSendMenu((prev) => !prev)}
                className="w-full sm:w-auto font-mono text-xs text-accent border-border-accent/40"
                rightIcon={
                  <svg
                    className={`h-3 w-3 transition-transform ${
                      showSendMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                }
              >
                Send to...
              </Button>

              {showSendMenu && (
                <div className="absolute bottom-full mb-2 right-0 w-56 rounded-xl bg-surface-raised border border-border-default shadow-xl p-1.5 z-20 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-mono text-text-muted uppercase border-b border-border-subtle mb-1">
                    Send to KALVEX Tool
                  </div>
                  {compatibleDestinations.map((dest) => (
                    <button
                      key={dest.slug}
                      type="button"
                      onClick={() => handleSendToTool(dest.slug)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-text-primary hover:bg-surface-hover hover:text-accent transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{dest.name}</span>
                      <span className="text-[10px] text-accent">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button variant="secondary" size="lg" onClick={onReset} className="sm:w-auto font-mono text-xs">
            Optimize Another File
          </Button>
        </div>

        {/* If larger, offer download of candidate */}
        {isLarger && (
          <button
            type="button"
            onClick={handleDownloadCandidate}
            className="text-[11px] font-mono text-text-muted hover:text-text-primary text-center underline cursor-pointer pt-1 transition-colors"
          >
            Download re-encoded candidate ({formatBytes(result.optimizedSize)}) anyway
          </button>
        )}
      </div>
    </div>
  );
}
