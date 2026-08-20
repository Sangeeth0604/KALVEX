"use client";

import React from "react";
import { LoadedSourceInfo } from "@/lib/tools/format-converter/types";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

interface DocumentSummaryProps {
  source: LoadedSourceInfo;
  onChangeFile: () => void;
  disabled?: boolean;
}

export function DocumentSummary({
  source,
  onChangeFile,
  disabled = false,
}: DocumentSummaryProps) {
  const formatLabel =
    source.inputType === "pdf"
      ? "PDF Document"
      : source.mimeType.split("/")[1]?.toUpperCase() || "IMAGE";

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
            Source Document
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
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source.previewUrl}
          alt={source.name}
          className="max-h-[280px] max-w-full object-contain rounded shadow-subtle border border-border-subtle bg-white"
        />
      </div>

      {/* Metadata Specification Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-base text-xs font-mono">
        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Original Size</span>
          <span className="text-text-primary font-bold">{formatBytes(source.size)}</span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Format</span>
          <span className="text-text-primary font-bold">{formatLabel}</span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">
            {source.inputType === "pdf" ? "Pages" : "Dimensions"}
          </span>
          <span className="text-text-primary font-bold truncate">
            {source.inputType === "pdf"
              ? `${source.pageCount} Pages`
              : source.dimensions
              ? `${source.dimensions.width}×${source.dimensions.height}`
              : "1 Frame"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Engine</span>
          <span className="text-accent font-bold">Client Canvas</span>
        </div>
      </div>
    </div>
  );
}
