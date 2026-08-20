"use client";

import React from "react";
import Link from "next/link";
import { HistoryEntry } from "@/lib/history/types";
import { documentBus } from "@/lib/document-bus";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";
import { Button } from "@/components/ui/button";

interface HistoryCardProps {
  entry: HistoryEntry;
  onRemove: (id: string) => void;
}

export function HistoryCard({ entry, onRemove }: HistoryCardProps) {
  const isLiveInBus = entry.busArtifactId
    ? documentBus.getArtifact(entry.busArtifactId) !== undefined
    : false;

  // Resolve target route for live artifacts
  const getOpenHref = (): string => {
    if (!entry.busArtifactId) return "/tools";
    if (entry.sourceTool === "ai-workspace" || entry.operationType.startsWith("ai_")) {
      return `/ai-workspace?artifact=${entry.busArtifactId}`;
    }
    if (entry.sourceTool && entry.sourceTool !== "workflow-runner") {
      return `/tools/${entry.sourceTool}?artifact=${entry.busArtifactId}`;
    }
    // Default to AI Workspace for text/json or tools page
    if (entry.outputKind === "text") {
      return `/ai-workspace?artifact=${entry.busArtifactId}`;
    }
    return `/tools/format-converter?artifact=${entry.busArtifactId}`;
  };

  const formattedDate = new Date(entry.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getToolIcon = () => {
    if (entry.operationType === "workflow_run") return "⚡";
    if (entry.operationType === "compress" || entry.sourceTool === "image-compressor") return "🗜️";
    if (entry.operationType === "optimize" || entry.sourceTool === "pdf-optimizer") return "📉";
    if (entry.operationType === "ocr" || entry.sourceTool === "ocr-extractor") return "🔍";
    if (entry.operationType === "convert" || entry.sourceTool === "format-converter") return "🔄";
    if (entry.operationType === "assemble" || entry.sourceTool === "pdf-assembler") return "📑";
    return "✨";
  };

  return (
    <div className="p-4 rounded-xl bg-surface-base border border-border-default hover:border-border-accent/40 shadow-card transition-all space-y-3">
      {/* Top Row: Operation Badge, Outcome Tag, Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{getToolIcon()}</span>
          <span className="text-xs font-mono font-bold text-text-primary capitalize">
            {entry.operationType.replace("_", " ")}
          </span>
          <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
            {entry.sourceTool}
          </span>
          {entry.status === "success" ? (
            <span className="text-[10px] font-mono font-bold text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
              ✓ {entry.outcome}
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold text-error bg-error/10 px-2 py-0.5 rounded border border-error/30">
              ✗ Failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          <span>{formattedDate}</span>
          {entry.durationMs && (
            <>
              <span>•</span>
              <span className="text-text-secondary">{entry.durationMs} ms</span>
            </>
          )}
        </div>
      </div>

      {/* Middle Row: Input/Output Details */}
      <div className="p-3 rounded-lg bg-surface-raised/40 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Input:</span>
            <span className="font-medium text-text-primary truncate max-w-[200px]" title={entry.inputFilename}>
              {entry.inputFilename}
            </span>
            <span className="text-text-muted uppercase text-[10px]">
              ({entry.inputKind} • {formatBytes(entry.inputSize)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-muted">Output:</span>
            <span className="font-bold text-accent truncate max-w-[200px]" title={entry.outputFilename}>
              {entry.outputFilename}
            </span>
            {entry.outputSize && (
              <span className="text-text-secondary text-[10px]">
                ({formatBytes(entry.outputSize)})
              </span>
            )}
          </div>
        </div>

        {/* Savings Metric */}
        {entry.reductionBytes && entry.reductionBytes > 0 && (
          <div className="text-right shrink-0">
            <div className="text-accent font-bold text-sm">
              -{entry.savingsPercentage}%
            </div>
            <div className="text-[10px] text-text-muted">
              Saved {formatBytes(entry.reductionBytes)}
            </div>
          </div>
        )}
      </div>

      {/* Workflow Step Breakdown (if applicable) */}
      {entry.stepSummary && entry.stepSummary.length > 0 && (
        <div className="p-2.5 rounded-lg bg-surface-base border border-border-subtle space-y-1.5 text-[11px] font-mono">
          <span className="text-[10px] uppercase text-text-muted font-bold">Workflow Step Execution:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {entry.stepSummary.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-surface-raised text-[10px]">
                <span className="text-text-primary truncate max-w-[180px]">{s.title}</span>
                <span className={s.status === "success" ? "text-accent font-bold" : "text-error font-bold"}>
                  {s.status === "success" ? "✓" : "✗"} {s.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row: Availability Status & Actions */}
      <div className="flex items-center justify-between pt-1 text-xs font-mono">
        <div className="flex items-center gap-2">
          {isLiveInBus ? (
            <span className="text-[11px] text-accent flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Active in RAM Session
            </span>
          ) : (
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
              Metadata Only • Binary Purged
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLiveInBus && (
            <Link href={getOpenHref()}>
              <Button variant="primary" size="sm" className="text-xs font-mono font-bold py-1 h-7">
                {entry.sourceTool === "ai-workspace" || entry.operationType.startsWith("ai_") || entry.outputKind === "text"
                  ? "Open in AI Workspace ➔"
                  : "Continue in Tool ➔"}
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="text-[11px] text-text-muted hover:text-error transition-colors px-2 py-1 rounded cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
