"use client";

import React from "react";
import { LoadedDocumentInfo } from "@/lib/tools/ocr-extractor/types";
import { formatBytes } from "@/lib/tools/ocr-extractor/ocr-engine";

interface DocumentPreviewProps {
  docInfo: LoadedDocumentInfo;
  onChangeFile: () => void;
  disabled?: boolean;
}

export function DocumentPreview({
  docInfo,
  onChangeFile,
  disabled = false,
}: DocumentPreviewProps) {
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
        {/* Checkered pattern backdrop */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={docInfo.previewUrl}
          alt={docInfo.name}
          className="max-h-[280px] max-w-full object-contain rounded shadow-subtle border border-border-subtle bg-white"
        />
      </div>

      {/* Metadata Specification Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-base text-xs font-mono">
        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Size</span>
          <span className="text-text-primary font-bold">{formatBytes(docInfo.size)}</span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Type</span>
          <span className="text-text-primary font-bold uppercase truncate">
            {docInfo.inputType === "pdf" ? "PDF Document" : docInfo.type.split("/")[1] || "Image"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Pages / Frames</span>
          <span className="text-text-primary font-bold">
            {docInfo.pageCount} {docInfo.pageCount === 1 ? "Page" : "Pages"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Engine</span>
          <span className="text-accent font-bold">WASM Worker</span>
        </div>
      </div>
    </div>
  );
}
