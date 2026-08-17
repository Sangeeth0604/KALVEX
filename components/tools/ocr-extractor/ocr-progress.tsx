"use client";

import React from "react";
import { OcrProgress as ProgressType } from "@/lib/tools/ocr-extractor/types";

interface OcrProgressProps {
  progress: ProgressType | null;
}

export function OcrProgress({ progress }: OcrProgressProps) {
  const currentProgress = progress ? Math.min(100, Math.max(0, progress.progress)) : 10;
  const stage = progress?.stage || "Initializing OCR Worker...";

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Optical Character Recognition
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Extracting textual characters in local WebAssembly thread
            </p>
          </div>

          <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2.5 py-0.5 rounded border border-border-accent-subtle font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
            Active
          </span>
        </div>

        {/* Progress Display */}
        <div className="space-y-4 my-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-primary font-bold">{stage}</span>
            <span className="text-accent font-bold">{currentProgress}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="h-2.5 w-full bg-surface-raised rounded-full overflow-hidden border border-border-subtle p-0.5">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(0,245,155,0.4)]"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {progress && progress.totalPages > 1 && (
            <div className="text-[11px] font-mono text-text-muted flex justify-between">
              <span>Page {progress.currentPage} of {progress.totalPages}</span>
              <span>Sequential in-memory rendering</span>
            </div>
          )}
        </div>

        {/* Technical Architecture Info Box */}
        <div className="p-4 rounded-lg bg-surface-raised border border-border-subtle text-xs text-text-muted space-y-2">
          <div className="flex items-center gap-2 font-mono font-bold text-text-secondary">
            <span className="text-accent">⚙</span>
            <span>Local WASM Execution Pipeline</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Tesseract LSTM OCR engine runs in a dedicated browser Web Worker. Document frames are rendered in-memory and processed directly on your local CPU without network transfer.
          </p>
        </div>
      </div>
    </div>
  );
}
