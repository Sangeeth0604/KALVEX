import React from "react";
import { WorkspaceDocument } from "@/lib/ai-workspace/types";

interface DocumentViewerProps {
  document: WorkspaceDocument;
  selectedSectionId?: string | null;
  onSelectSection: (sectionId: string) => void;
}

export function DocumentViewer({
  document,
  selectedSectionId,
  onSelectSection,
}: DocumentViewerProps) {
  return (
    <div className="flex flex-col h-full rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
      {/* Titlebar */}
      <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
            Source Document Inspector
          </span>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          {document.sections.length} Clauses Indexed
        </span>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border-subtle/50 max-h-[640px]">
        {document.sections.map((section) => {
          const isSelected = selectedSectionId === section.id;
          return (
            <div
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`pt-3 first:pt-0 p-3 rounded-lg transition-colors cursor-pointer ${
                isSelected
                  ? "bg-accent-subtle/40 border border-border-accent"
                  : "hover:bg-surface-hover border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-accent bg-surface-raised px-1.5 py-0.5 rounded border border-border-subtle">
                    {section.clauseNumber}
                  </span>
                  <span className="text-xs font-bold text-text-primary">
                    {section.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  Page {section.page}
                </span>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {section.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-surface-raised/60 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Isolated Memory Buffer
        </span>
        <span>Zero Server Disk Storage</span>
      </div>
    </div>
  );
}
