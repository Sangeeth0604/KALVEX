"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PdfExportResult } from "@/lib/tools/pdf-assembler/types";
import { formatBytes } from "@/lib/tools/pdf-assembler/pdf-engine";

interface PdfExportPanelProps {
  result: PdfExportResult;
  onReset: () => void;
  onBackToWorkspace?: () => void;
}

export function PdfExportPanel({
  result,
  onReset,
  onBackToWorkspace,
}: PdfExportPanelProps) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = result.objectUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full bg-accent animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
            PDF Generation Complete
          </h3>
        </div>

        <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold">
          {result.operationType === "extract" ? "Extracted PDF" : "Assembled PDF"}
        </span>
      </div>

      {/* Main Document Details Card */}
      <div className="p-5 rounded-xl bg-surface-raised border border-border-subtle mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* PDF Icon Graphic */}
        <div className="h-20 w-16 rounded-lg bg-surface-base border border-border-default flex flex-col items-center justify-center text-accent shrink-0 shadow-subtle">
          <span className="text-xs font-mono font-extrabold uppercase">PDF</span>
          <span className="text-[10px] font-mono text-text-muted mt-1">
            {result.pageCount}p
          </span>
        </div>

        {/* Specs Table */}
        <div className="flex-1 w-full space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b border-border-subtle/60 pb-1.5">
            <span className="text-text-muted">Output Filename:</span>
            <span className="text-text-primary font-bold truncate max-w-[240px]" title={result.fileName}>
              {result.fileName}
            </span>
          </div>

          <div className="flex justify-between border-b border-border-subtle/60 pb-1.5">
            <span className="text-text-muted">Total Page Count:</span>
            <span className="text-text-primary font-bold">
              {result.pageCount} {result.pageCount === 1 ? "Page" : "Pages"}
            </span>
          </div>

          <div className="flex justify-between border-b border-border-subtle/60 pb-1.5">
            <span className="text-text-muted">Generated File Size:</span>
            <span className="text-accent font-bold">
              {formatBytes(result.fileSize)}
            </span>
          </div>

          <div className="flex justify-between pt-0.5">
            <span className="text-text-muted">Generation Time:</span>
            <span className="text-text-secondary">
              {result.durationMs} ms (Client In-Memory)
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleDownload}
          className="flex-1 font-bold shadow-subtle"
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
          Download PDF Document
        </Button>

        {onBackToWorkspace && (
          <Button
            variant="outline"
            size="lg"
            onClick={onBackToWorkspace}
            className="sm:w-auto font-mono text-xs"
          >
            Edit Workspace
          </Button>
        )}

        <Button
          variant="secondary"
          size="lg"
          onClick={onReset}
          className="sm:w-auto font-mono text-xs text-text-secondary"
        >
          Start Over
        </Button>
      </div>
    </div>
  );
}
