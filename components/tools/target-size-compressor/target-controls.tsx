"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { TargetUnit, TargetSizeConfig } from "@/lib/tools/target-size-compressor/types";
import { parseTargetBytes, formatBytes } from "@/lib/tools/target-size-compressor/engine";

interface TargetControlsProps {
  onCompress: (targetConfig: TargetSizeConfig) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const QUICK_PRESETS: Array<{ label: string; value: number; unit: TargetUnit }> = [
  { label: "100 KB", value: 100, unit: "KB" },
  { label: "200 KB", value: 200, unit: "KB" },
  { label: "500 KB", value: 500, unit: "KB" },
  { label: "1 MB", value: 1, unit: "MB" },
  { label: "2 MB", value: 2, unit: "MB" },
];

export function TargetControls({
  onCompress,
  disabled = false,
  isProcessing = false,
}: TargetControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("1 MB");
  const [customValue, setCustomValue] = useState<string>("1");
  const [customUnit, setCustomUnit] = useState<TargetUnit>("MB");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const handleSelectPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    setIsCustomMode(false);
    setCustomValue(preset.value.toString());
    setCustomUnit(preset.unit);
  };

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    setIsCustomMode(true);
    setSelectedPreset("");
  };

  const handleCustomUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value as TargetUnit;
    setCustomUnit(unit);
    setIsCustomMode(true);
    setSelectedPreset("");
  };

  const numVal = parseFloat(customValue) || 1;
  const targetBytes = parseTargetBytes(numVal, customUnit);
  const targetLabel = `${numVal} ${customUnit}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isProcessing || targetBytes <= 0) return;
    onCompress({
      targetBytes,
      targetLabel,
      unit: customUnit,
      value: numVal,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border-default bg-surface-base shadow-card p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        {/* Title & Badge */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Target File Size
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Select a target limit or enter a custom size
            </p>
          </div>
          <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle font-semibold">
            Target: {targetLabel}
          </span>
        </div>

        {/* 1. Quick Presets */}
        <div className="mb-5">
          <label className="block text-xs font-mono uppercase text-text-secondary mb-2">
            Target Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {QUICK_PRESETS.map((p) => {
              const isSelected = !isCustomMode && selectedPreset === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={disabled || isProcessing}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-surface-raised text-accent border-border-accent shadow-subtle font-bold"
                      : "bg-surface-base text-text-secondary border-border-default hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <span>{p.label}</span>
                  {p.label === "1 MB" && (
                    <span className="text-[9px] uppercase px-1 rounded bg-accent text-accent-foreground font-bold">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Custom Target Size */}
        <div className="pt-4 border-t border-border-subtle mb-6">
          <label className="block text-xs font-mono uppercase text-text-secondary mb-2">
            Custom Target Size
          </label>
          <div className="flex items-center gap-2 max-w-xs">
            <input
              type="number"
              min="1"
              max="100"
              step="any"
              value={customValue}
              onChange={handleCustomValueChange}
              disabled={disabled || isProcessing}
              placeholder="e.g. 500"
              className="flex-1 px-3 py-2 bg-surface-raised border border-border-default rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <select
              value={customUnit}
              onChange={handleCustomUnitChange}
              disabled={disabled || isProcessing}
              className="px-3 py-2 bg-surface-raised border border-border-default rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </div>
          <p className="text-[11px] font-mono text-text-muted mt-1.5">
            Target limit: <strong className="text-accent">{formatBytes(targetBytes)}</strong> ({targetBytes.toLocaleString()} bytes)
          </p>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={disabled || isProcessing || targetBytes <= 0}
          className="w-full h-11 font-mono text-xs sm:text-sm font-bold cursor-pointer shadow-subtle"
        >
          {isProcessing
            ? "Optimizing to Target..."
            : targetLabel === "1 MB"
            ? "Compress to 1 MB ➔"
            : `Compress to ${targetLabel} ➔`}
        </Button>
      </div>
    </form>
  );
}
