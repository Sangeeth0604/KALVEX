"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { TargetCompressorResult } from "@/lib/tools/target-size-compressor/types";
import { formatBytes } from "@/lib/tools/target-size-compressor/engine";

interface TargetResultProps {
  result: TargetCompressorResult;
  onReset: () => void;
  onAdjustTarget?: () => void;
}

export function TargetResult({ result, onReset, onAdjustTarget }: TargetResultProps) {
  const handleDownload = () => {
    const url = URL.createObjectURL(result.outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const isReduced = result.savingsPercentage > 0;

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-6 flex flex-col justify-between font-mono animate-in fade-in duration-200">
      <div>
        {/* Header with Status Indicator */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Compression Results
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-md">
              Processed in {result.durationMs} ms in browser RAM
            </p>
          </div>

          {result.targetReached ? (
            <span className="text-[11px] text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold">
              ✓ Target Reached ({isReduced ? `-${result.savingsPercentage}%` : "0%"})
            </span>
          ) : (
            <span className="text-[11px] text-warning bg-warning/10 px-2.5 py-0.5 rounded border border-warning/30 font-semibold">
              ⚠ Target Not Reached
            </span>
          )}
        </div>

        {/* Warning / Format Change Notice */}
        {result.warningNotice && (
          <div className="mb-6 p-4 rounded-lg bg-surface-raised border border-border-default text-xs leading-relaxed space-y-2 font-sans">
            <div className="flex items-center gap-2 font-bold text-text-primary font-mono">
              <span className="text-accent">ℹ</span>
              <span>{result.warningNotice}</span>
            </div>
          </div>
        )}

        {result.formatChanged && result.formatChangeReason && (
          <div className="mb-6 p-4 rounded-lg bg-surface-raised border border-border-default text-xs leading-relaxed space-y-2 font-sans">
            <div className="flex items-center gap-2 font-bold text-text-primary font-mono">
              <span className="text-accent">🔄</span>
              <span>{result.formatChangeReason}</span>
            </div>
          </div>
        )}

        {!result.targetReached && (
          <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30 text-xs leading-relaxed space-y-2 font-sans">
            <div className="flex items-center gap-2 font-bold text-warning font-mono">
              <span>⚠</span>
              <span>Target limit could not be met</span>
            </div>
            <p className="text-text-secondary">
              This file could not be reduced to the requested size without excessive quality or content loss. The best achievable result is shown below.
            </p>
          </div>
        )}

        {/* Size Metrics Comparison Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
              Target Size
            </span>
            <span className="text-sm sm:text-base font-bold text-text-muted">
              {formatBytes(result.targetBytes)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-1">
              Output Size
            </span>
            <span
              className={`text-sm sm:text-base font-bold ${
                result.targetReached ? "text-accent" : "text-warning"
              }`}
            >
              {formatBytes(result.outputSize)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
            <span className="text-[10px] text-text-muted uppercase block mb-1">
              Savings
            </span>
            <span className="text-sm sm:text-base font-bold text-accent">
              {result.savingsPercentage > 0 ? `-${result.savingsPercentage}%` : "0%"}
            </span>
          </div>
        </div>

        {/* Metadata Breakdown */}
        <div className="p-3.5 rounded-lg bg-surface-raised border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted mb-6">
          <div>
            <span>Format: </span>
            <strong className="text-text-primary">{result.outputFormat}</strong>
          </div>
          <div>
            <span>Ratio: </span>
            <strong className="text-text-primary">{result.compressionRatio}:1</strong>
          </div>
          <div>
            <span>Attempts: </span>
            <strong className="text-text-primary">{result.attempts} iterations</strong>
          </div>
          <div>
            <span>Duration: </span>
            <strong className="text-text-primary">{result.durationMs} ms</strong>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center gap-3">
        {result.targetReached ? (
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
              className="w-full sm:flex-1 h-11 font-mono text-xs sm:text-sm font-bold cursor-pointer shadow-subtle"
            >
              Download File ({formatBytes(result.outputSize)}) ➔
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onReset}
              className="w-full sm:w-auto h-11 font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary"
            >
              Compress Another File
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDownload}
              className="w-full sm:flex-1 h-11 font-mono text-xs sm:text-sm font-bold cursor-pointer"
            >
              Download Best Result ({formatBytes(result.outputSize)}) ➔
            </Button>
            {onAdjustTarget && (
              <Button
                variant="primary"
                size="lg"
                onClick={onAdjustTarget}
                className="w-full sm:w-auto h-11 font-mono text-xs font-bold cursor-pointer"
              >
                Try Larger Target
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={onReset}
              className="w-full sm:w-auto h-11 font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary"
            >
              Compress Another
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
