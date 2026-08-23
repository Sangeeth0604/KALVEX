"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CompressionResult as ResultType } from "@/lib/tools/image-compressor/types";
import { formatBytes } from "@/lib/tools/image-compressor/image-compressor";
import { documentBus } from "@/lib/document-bus/document-bus";

interface CompressionResultProps {
  result: ResultType;
  onReset: () => void;
}

export function CompressionResult({ result, onReset }: CompressionResultProps) {
  const router = useRouter();

  const isReduced = result.wasCompressed;
  const isRetained = result.retainedOriginal;

  const sizeDiffBytes = Math.abs(result.reductionBytes);
  const sizeDiffPercent = Math.abs(result.savingsPercentage).toFixed(1);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = result.outputObjectUrl;
    a.download = result.outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const compatibleDestinations = documentBus.getCompatibleDestinations(
    result.outputMimeType,
    "image-compressor"
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
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-6 flex flex-col justify-between font-mono">
      <div>
        {/* Header with Status Indicator */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Compression Results
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Processed in {result.durationMs} ms in browser RAM
            </p>
          </div>

          {isReduced ? (
            <span className="text-[11px] text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold">
              ✓ Reduced (-{sizeDiffPercent}%)
            </span>
          ) : (
            <span className="text-[11px] text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle font-semibold">
              ℹ Original Preserved
            </span>
          )}
        </div>

        {/* Explanatory Callout Banner when Original is Retained */}
        {isRetained && (
          <div className="mb-6 p-4 rounded-lg bg-surface-raised border border-border-default text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-text-primary">
              <span className="text-accent">ℹ</span>
              <span>Original retained — no smaller lossless encoding was found.</span>
            </div>
            <p className="text-text-secondary font-sans">
              In-browser re-encoding did not yield a smaller file without sacrificing fidelity.
              KALVEX has automatically preserved your original <strong className="text-text-primary font-mono">{result.outputFormat}</strong> image ({formatBytes(result.originalSize)}) to prevent file bloat.
            </p>
          </div>
        )}

        {/* Size Metrics Comparison Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
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
              Output Size
            </span>
            <span className="text-sm sm:text-base font-bold text-text-primary">
              {formatBytes(result.outputSize)}
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border text-center ${
              isReduced
                ? "bg-accent-subtle/30 border-border-accent-subtle"
                : "bg-surface-raised border-border-subtle"
            }`}
          >
            <span
              className={`text-[10px] uppercase block mb-1 font-semibold ${
                isReduced ? "text-accent" : "text-text-muted"
              }`}
            >
              Savings
            </span>
            <span
              className={`text-sm sm:text-base font-bold ${
                isReduced ? "text-accent" : "text-text-muted"
              }`}
            >
              {isReduced ? `-${sizeDiffPercent}%` : "0% (Preserved)"}
            </span>
          </div>
        </div>

        {/* Image Preview Canvas */}
        <div className="relative bg-surface-base/80 p-4 rounded-lg border border-border-subtle mb-6 flex items-center justify-center min-h-[180px] max-h-[260px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.outputObjectUrl}
            alt={result.outputFilename}
            className="max-h-[220px] max-w-full object-contain rounded shadow-subtle border border-border-subtle/40"
          />
        </div>

        {/* File Specs Details */}
        <div className="p-3 rounded-lg bg-surface-raised/50 border border-border-subtle mb-6 text-xs text-text-muted space-y-1.5">
          <div className="flex justify-between">
            <span>Output Format:</span>
            <span className="text-text-primary font-bold">{result.outputFormat}</span>
          </div>
          <div className="flex justify-between">
            <span>Output File:</span>
            <span className="text-text-primary truncate max-w-[220px]">
              {result.outputFilename}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Dimensions:</span>
            <span className="text-text-primary">
              {result.width} × {result.height} px
            </span>
          </div>
          <div className="flex justify-between">
            <span>Net Change:</span>
            <span className={isReduced ? "text-accent font-bold" : "text-text-muted font-medium"}>
              {isReduced
                ? `Saved ${formatBytes(sizeDiffBytes)} (-${sizeDiffPercent}%)`
                : "0 Bytes (Original Retained)"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Hierarchy: Next Operations & Download */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border-subtle">
        {/* Next Operation Bar */}
        {compatibleDestinations.length > 0 && result.busDocumentId && (
          <div className="p-3 rounded-lg bg-surface-raised/60 border border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-[11px]">
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
                  className="px-3 py-1.5 rounded-lg bg-surface-base border border-border-default hover:border-border-accent hover:text-accent text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
                >
                  <span>{dest.name}</span>
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
            onClick={handleDownload}
            className="flex-1 font-bold shadow-subtle text-xs"
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
              ? `Download Compressed ${result.outputFormat}`
              : `Download Original ${result.outputFormat}`}
          </Button>

          <Button variant="secondary" size="lg" onClick={onReset} className="sm:w-auto text-xs">
            Compress Another Image
          </Button>
        </div>
      </div>
    </div>
  );
}
