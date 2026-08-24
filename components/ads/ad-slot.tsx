"use client";

import React from "react";

interface AdSlotProps {
  slotId?: string;
  format?: "banner" | "rectangle" | "horizontal" | "responsive";
  className?: string;
  label?: string;
}

/**
 * Reusable Advertisement Slot Placeholder
 * Visually isolated from active document-processing workflows.
 * Supports placeholder/disabled mode without external network requests.
 */
export function AdSlot({
  slotId = "default-slot",
  format = "horizontal",
  className = "",
  label = "Advertisement",
}: AdSlotProps) {
  const getFormatClasses = () => {
    switch (format) {
      case "banner":
        return "min-h-[90px] py-4";
      case "rectangle":
        return "min-h-[250px] py-8";
      case "horizontal":
      default:
        return "min-h-[100px] py-6";
    }
  };

  return (
    <div
      data-ad-slot={slotId}
      className={`w-full rounded-xl border border-dashed border-border-default/70 bg-surface-raised/30 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors ${getFormatClasses()} ${className}`}
      aria-label={label}
    >
      <div className="space-y-1.5 max-w-sm">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted bg-surface-base px-2 py-0.5 rounded border border-border-subtle inline-block">
          {label}
        </span>
        <p className="text-xs text-text-muted font-mono leading-relaxed">
          Non-intrusive sponsor placement supporting free client-side infrastructure.
        </p>
      </div>
    </div>
  );
}
