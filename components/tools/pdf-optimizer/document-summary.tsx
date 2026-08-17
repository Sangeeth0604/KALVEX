"use client";

import React from "react";
import { PdfDocAnalysis } from "@/lib/tools/pdf-optimizer/types";
import { formatBytes } from "@/lib/tools/pdf-optimizer/pdf-engine";

interface DocumentSummaryProps {
  analysis: PdfDocAnalysis;
  onChangeFile: () => void;
  disabled?: boolean;
}

export function DocumentSummary({
  analysis,
  onChangeFile,
  disabled = false,
}: DocumentSummaryProps) {
  const hasMetadata =
    Boolean(analysis.title || analysis.author || analysis.producer || analysis.creator) ||
    analysis.hasMetadataStream;

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
            Source PDF Document
          </span>
          <span className="text-[10px] font-mono text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-border-accent-subtle">
            Loaded in RAM
          </span>
        </div>

        <button
          type="button"
          onClick={onChangeFile}
          disabled={disabled}
          className="text-xs font-mono text-text-secondary hover:text-accent disabled:opacity-50 cursor-pointer transition-colors"
        >
          Change File
        </button>
      </div>

      {/* Preview Container */}
      <div className="relative bg-surface-base/80 p-4 flex items-center justify-center min-h-[220px] max-h-[340px] overflow-hidden border-b border-border-subtle">
        {/* Subtle Checkered backdrop */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        />

        {analysis.previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={analysis.previewUrl}
            alt={analysis.name}
            className="max-h-[280px] max-w-full object-contain rounded shadow-subtle border border-border-subtle bg-white"
          />
        ) : (
          <div className="h-[200px] w-[150px] rounded bg-surface-raised border border-border-subtle flex flex-col items-center justify-center p-3 text-center">
            <svg
              className="h-10 w-10 text-accent mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-mono font-bold text-text-primary truncate max-w-full">
              {analysis.name}
            </span>
          </div>
        )}
      </div>

      {/* Metadata Specification Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-base text-xs font-mono">
        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Original Size</span>
          <span className="text-text-primary font-bold">{formatBytes(analysis.size)}</span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Total Pages</span>
          <span className="text-text-primary font-bold">
            {analysis.pageCount} {analysis.pageCount === 1 ? "Page" : "Pages"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Metadata</span>
          <span className={hasMetadata ? "text-accent font-bold" : "text-text-muted"}>
            {hasMetadata ? "Detected" : "Clean"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Architecture</span>
          <span className="text-text-primary font-bold">Object Streams</span>
        </div>
      </div>
    </div>
  );
}
