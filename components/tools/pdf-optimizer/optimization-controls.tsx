"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { OptimizationSettings } from "@/lib/tools/pdf-optimizer/types";

interface OptimizationControlsProps {
  settings: OptimizationSettings;
  onUpdateSettings: (newSettings: Partial<OptimizationSettings>) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}

export function OptimizationControls({
  settings,
  onUpdateSettings,
  onOptimize,
  isOptimizing,
}: OptimizationControlsProps) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Optimization Pipeline
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Structural & Lossless-First PDF Stream Optimization
            </p>
          </div>

          <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle font-medium">
            Lossless-First
          </span>
        </div>

        {/* Settings Configuration Options */}
        <div className="space-y-4 mb-6">
          <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-raised border border-border-subtle cursor-pointer hover:border-border-accent/60 transition-colors">
            <input
              type="checkbox"
              checked={settings.useObjectStreams}
              disabled={isOptimizing}
              onChange={(e) => onUpdateSettings({ useObjectStreams: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-accent cursor-pointer disabled:opacity-50"
            />
            <div className="text-xs">
              <span className="font-mono font-bold text-text-primary block mb-0.5">
                Object Stream Compression (PDF 1.5+)
              </span>
              <span className="text-text-muted leading-relaxed block text-[11px]">
                Packs cross-reference tables and non-stream PDF objects into compressed Object Streams to minimize header dictionary footprint.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-raised border border-border-subtle cursor-pointer hover:border-border-accent/60 transition-colors">
            <input
              type="checkbox"
              checked={settings.stripMetadata}
              disabled={isOptimizing}
              onChange={(e) => onUpdateSettings({ stripMetadata: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-accent cursor-pointer disabled:opacity-50"
            />
            <div className="text-xs">
              <span className="font-mono font-bold text-text-primary block mb-0.5">
                Scrub Document Metadata & XML Streams
              </span>
              <span className="text-text-muted leading-relaxed block text-[11px]">
                Purges author, producer, creation timestamps, creator software signatures, and catalog XMP metadata streams.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-raised border border-border-subtle cursor-pointer hover:border-border-accent/60 transition-colors">
            <input
              type="checkbox"
              checked={settings.pruneOrphanObjects}
              disabled={isOptimizing}
              onChange={(e) => onUpdateSettings({ pruneOrphanObjects: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-accent cursor-pointer disabled:opacity-50"
            />
            <div className="text-xs">
              <span className="font-mono font-bold text-text-primary block mb-0.5">
                Prune Orphaned Objects & Edit Histories
              </span>
              <span className="text-text-muted leading-relaxed block text-[11px]">
                Rebuilds the page graph into a clean context, discarding unreachable objects and unreferenced incremental revision diffs.
              </span>
            </div>
          </label>
        </div>

        {/* Semantic Preservation Notice */}
        <div className="p-3.5 rounded-lg bg-surface-raised/70 border border-border-subtle text-xs text-text-muted leading-relaxed space-y-1.5 mb-6">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-text-secondary text-[11px]">
            <span>ℹ</span>
            <span>Fidelity & Preservation Policy:</span>
          </div>
          <p className="text-[11px] text-text-secondary">
            Profile 1 is designed to preserve existing PDF semantics, including selectable text layers, font encodings, and vector fidelity. Zero canvas rasterization is performed during optimization.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-border-subtle">
        <Button
          variant="primary"
          size="lg"
          onClick={onOptimize}
          disabled={isOptimizing}
          isLoading={isOptimizing}
          className="w-full font-bold shadow-subtle font-mono text-xs"
        >
          {isOptimizing ? "Optimizing PDF in Browser..." : "Optimize PDF Document"}
        </Button>
      </div>
    </div>
  );
}
