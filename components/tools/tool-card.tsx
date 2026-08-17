import React from "react";
import Link from "next/link";
import { ToolItem } from "@/lib/tools/types";

interface ToolCardProps {
  tool: ToolItem;
}

export function ToolCard({ tool }: ToolCardProps) {
  const isAvailable = tool.status === "available";

  const cardContent = (
    <div
      className={`p-5 rounded-xl bg-surface-base border transition-all duration-150 flex flex-col justify-between shadow-card h-full ${
        isAvailable
          ? "border-border-default hover:border-accent hover:shadow-[0_4px_20px_-4px_rgba(0,245,155,0.2)] cursor-pointer group"
          : "border-border-default hover:border-border-accent/60"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
            {tool.categoryLabel}
          </span>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              isAvailable
                ? "text-accent bg-accent-subtle border-border-accent-subtle font-semibold"
                : "text-text-muted bg-surface-raised border border-border-subtle"
            }`}
          >
            {isAvailable ? "● Available" : tool.statusLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-text-primary mb-1.5 flex items-center justify-between">
          <span>{tool.name}</span>
          {isAvailable && (
            <span className="text-accent text-sm transition-transform group-hover:translate-x-1">
              →
            </span>
          )}
        </h3>

        {/* Description */}
        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          {tool.description}
        </p>

        {/* Architectural Execution Model */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-raised/80 border border-border-subtle text-[11px] font-mono text-text-muted mb-4">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAvailable ? "bg-accent" : "bg-border-strong"
            }`}
          />
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

  if (isAvailable) {
    return (
      <Link href={`/tools/${tool.slug}`} className="block h-full outline-none">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
