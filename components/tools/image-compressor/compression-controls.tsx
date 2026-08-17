"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  CompressionSettings,
  ImageMetadata,
  OutputFormatOption,
  QualityPreset,
} from "@/lib/tools/image-compressor/types";
import {
  QUALITY_PRESETS,
  resolveOutputMimeType,
} from "@/lib/tools/image-compressor/image-compressor";

interface CompressionControlsProps {
  metadata: ImageMetadata;
  settings: CompressionSettings;
  onUpdateSettings: (newSettings: Partial<CompressionSettings>) => void;
  onCompress: () => void;
  isCompressing: boolean;
}

export function CompressionControls({
  metadata,
  settings,
  onUpdateSettings,
  onCompress,
  isCompressing,
}: CompressionControlsProps) {
  const { mimeType } = resolveOutputMimeType(metadata.type, settings.outputFormat);
  const isPngOutput = mimeType === "image/png";

  const handleFormatChange = (format: OutputFormatOption) => {
    onUpdateSettings({ outputFormat: format });
  };

  const handlePresetChange = (preset: QualityPreset) => {
    onUpdateSettings({
      qualityPreset: preset,
      quality: QUALITY_PRESETS[preset],
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({
      quality: val,
      qualityPreset: "custom",
    });
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-5 flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Compression Settings
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Configure output encoding and quality presets
            </p>
          </div>
          <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
            Browser Canvas API
          </span>
        </div>

        {/* 1. Output Format Selection */}
        <div className="mb-6">
          <label className="block text-xs font-mono uppercase text-text-secondary mb-2">
            Target Output Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: "original" as OutputFormatOption, label: "Original" },
              { key: "image/webp" as OutputFormatOption, label: "WEBP", badge: "Rec" },
              { key: "image/jpeg" as OutputFormatOption, label: "JPG" },
              { key: "image/png" as OutputFormatOption, label: "PNG" },
            ].map((fmt) => {
              const isSelected = settings.outputFormat === fmt.key;
              return (
                <button
                  key={fmt.key}
                  type="button"
                  disabled={isCompressing}
                  onClick={() => handleFormatChange(fmt.key)}
                  className={`relative p-2.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-surface-raised text-accent border-border-accent shadow-subtle font-bold"
                      : "bg-surface-base text-text-secondary border-border-default hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <span>{fmt.label}</span>
                  {fmt.badge && (
                    <span className="text-[9px] uppercase px-1 rounded bg-accent text-accent-foreground font-bold">
                      {fmt.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Quality Control (for Lossy Formats: JPG / WEBP) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase text-text-secondary">
              Encoder Quality
            </label>
            {!isPngOutput && (
              <span className="text-xs font-mono font-bold text-accent">
                {Math.round(settings.quality * 100)}%
              </span>
            )}
          </div>

          {isPngOutput ? (
            <div className="p-3 rounded-lg bg-surface-raised/70 border border-border-subtle text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-text-secondary block mb-1">
                ℹ Lossless PNG Encoding:
              </span>
              Browser PNG encoding operates in lossless mode without compression artifacts. Quality
              sliders apply only to lossy encoders (WEBP and JPG).
            </div>
          ) : (
            <div className="space-y-3">
              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "low" as QualityPreset, label: "Low (50%)", hint: "Max Shrink" },
                  { key: "balanced" as QualityPreset, label: "Balanced (75%)", hint: "Optimal" },
                  { key: "high" as QualityPreset, label: "High (90%)", hint: "Max Quality" },
                ].map((preset) => {
                  const isSelected = settings.qualityPreset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      disabled={isCompressing}
                      onClick={() => handlePresetChange(preset.key)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer disabled:opacity-50 ${
                        isSelected
                          ? "bg-surface-raised text-accent border-border-accent font-semibold"
                          : "bg-surface-base text-text-secondary border-border-subtle hover:text-text-primary hover:bg-surface-hover"
                      }`}
                    >
                      <span className="block text-xs font-mono">{preset.label}</span>
                      <span className="block text-[10px] text-text-muted">{preset.hint}</span>
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              <div className="pt-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.quality}
                  disabled={isCompressing}
                  onChange={handleSliderChange}
                  className="w-full accent-accent cursor-pointer disabled:opacity-50"
                  aria-label="Quality slider"
                />
                <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                  <span>10% (Smallest)</span>
                  <span>100% (Largest)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-border-subtle">
        <Button
          variant="primary"
          size="lg"
          onClick={onCompress}
          disabled={isCompressing}
          isLoading={isCompressing}
          className="w-full font-bold shadow-subtle"
        >
          {isCompressing ? "Compressing in Browser..." : "Compress Image"}
        </Button>
      </div>
    </div>
  );
}
