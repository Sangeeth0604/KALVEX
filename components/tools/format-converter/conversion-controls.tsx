"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ConversionSettings,
  ImageOutputFormat,
  LoadedSourceInfo,
} from "@/lib/tools/format-converter/types";

interface ConversionControlsProps {
  source: LoadedSourceInfo;
  settings: ConversionSettings;
  onUpdateSettings: (newSettings: Partial<ConversionSettings>) => void;
  onConvert: () => void;
  isConverting: boolean;
}

export function ConversionControls({
  source,
  settings,
  onUpdateSettings,
  onConvert,
  isConverting,
}: ConversionControlsProps) {
  const isPdf = source.inputType === "pdf";
  const isLossyTarget =
    settings.targetFormat === "image/jpeg" || settings.targetFormat === "image/webp";

  const targetFormatOptions: Array<{
    format: ImageOutputFormat;
    label: string;
    description: string;
  }> = isPdf
    ? [
        {
          format: "image/png",
          label: "PNG Image",
          description: "Lossless crisp render with maximum clarity",
        },
        {
          format: "image/jpeg",
          label: "JPG Image",
          description: "Compact web photo format with reduced size",
        },
      ]
    : [
        {
          format: "image/png",
          label: "PNG",
          description: "Lossless bitmap format preserving transparency",
        },
        {
          format: "image/jpeg",
          label: "JPG",
          description: "Universal photographic format",
        },
        {
          format: "image/webp",
          label: "WEBP",
          description: "Next-gen web format with high compression",
        },
      ];

  const targetExtLabel =
    settings.targetFormat === "image/png"
      ? "PNG"
      : settings.targetFormat === "image/jpeg"
      ? "JPG"
      : "WEBP";

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Target Format Configuration
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Select output encoding and parameters
            </p>
          </div>

          <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle font-medium">
            100% In-Browser
          </span>
        </div>

        {/* Format Selection Grid */}
        <div className="space-y-4 mb-6">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary block">
            Select Output Format
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {targetFormatOptions.map((opt) => {
              const isSelected = settings.targetFormat === opt.format;
              return (
                <button
                  key={opt.format}
                  type="button"
                  disabled={isConverting}
                  onClick={() => onUpdateSettings({ targetFormat: opt.format })}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-accent-subtle/30 border-border-accent shadow-sm"
                      : "bg-surface-raised border-border-subtle hover:border-border-default hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted leading-tight">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider for Lossy Targets */}
        {isLossyTarget && (
          <div className="p-4 rounded-lg bg-surface-raised border border-border-subtle space-y-2 mb-6">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-secondary font-bold">
                Encoding Quality
              </span>
              <span className="text-accent font-bold">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={settings.quality}
              disabled={isConverting}
              onChange={(e) =>
                onUpdateSettings({ quality: parseFloat(e.target.value) })
              }
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-text-muted">
              <span>More Compact</span>
              <span>Maximum Fidelity</span>
            </div>
          </div>
        )}

        {/* Multi-page PDF Page Selection */}
        {isPdf && source.pageCount > 1 && (
          <div className="p-4 rounded-lg bg-surface-raised border border-border-subtle space-y-3 mb-6">
            <label className="text-xs font-mono font-bold text-text-secondary block">
              Page Range Selection
            </label>

            <div className="flex items-center gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pageSelection"
                  checked={settings.pageSelection === "all"}
                  onChange={() => onUpdateSettings({ pageSelection: "all" })}
                  className="accent-accent"
                />
                <span className="text-text-primary">
                  All Pages ({source.pageCount} Pages)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pageSelection"
                  checked={settings.pageSelection === "range"}
                  onChange={() => onUpdateSettings({ pageSelection: "range" })}
                  className="accent-accent"
                />
                <span className="text-text-primary">Custom Range</span>
              </label>
            </div>

            {settings.pageSelection === "range" && (
              <div className="flex items-center gap-2 pt-2 text-xs font-mono">
                <span className="text-text-muted">From Page</span>
                <input
                  type="number"
                  min="1"
                  max={source.pageCount}
                  value={settings.pageRangeStart}
                  onChange={(e) =>
                    onUpdateSettings({
                      pageRangeStart: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-16 p-1.5 rounded bg-surface-base border border-border-default text-text-primary text-center"
                />
                <span className="text-text-muted">to</span>
                <input
                  type="number"
                  min={settings.pageRangeStart}
                  max={source.pageCount}
                  value={settings.pageRangeEnd}
                  onChange={(e) =>
                    onUpdateSettings({
                      pageRangeEnd: parseInt(e.target.value) || source.pageCount,
                    })
                  }
                  className="w-16 p-1.5 rounded bg-surface-base border border-border-default text-text-primary text-center"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-border-subtle">
        <Button
          variant="primary"
          size="lg"
          onClick={onConvert}
          disabled={isConverting}
          isLoading={isConverting}
          className="w-full font-bold shadow-subtle font-mono text-xs"
        >
          {isConverting
            ? "Converting in Browser..."
            : `Convert to ${targetExtLabel}`}
        </Button>
      </div>
    </div>
  );
}
