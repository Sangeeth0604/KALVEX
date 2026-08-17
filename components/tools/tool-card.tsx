import React from "react";
import { ToolItem } from "@/lib/tools/types";

interface ToolCardProps {
  tool: ToolItem;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="p-5 rounded-xl bg-surface-base border border-border-default hover:border-border-accent/60 transition-all duration-150 flex flex-col justify-between shadow-card">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
            {tool.categoryLabel}
          </span>
          <span className="text-[11px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
            {tool.statusLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-text-primary mb-1.5">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          {tool.description}
        </p>

        {/* Architectural Execution Model */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-raised/80 border border-border-subtle text-[11px] font-mono text-text-muted mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
          <span>Architecture: {tool.executionLabel}</span>
        </div>
      </div>

      {/* Format Flow Footer */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-text-muted">In:</span>
          <span className="text-text-primary truncate font-medium">
            {tool.inputFormats.join(", ")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-muted">Out:</span>
          <span className="text-accent font-medium">{tool.outputFormat}</span>
        </div>
      </div>
    </div>
  );
}
