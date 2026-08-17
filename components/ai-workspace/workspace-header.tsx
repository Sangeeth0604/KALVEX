import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkspaceDocument } from "@/lib/ai-workspace/types";

interface WorkspaceHeaderProps {
  document: WorkspaceDocument;
  onClearSession: () => void;
}

export function WorkspaceHeader({
  document,
  onClearSession,
}: WorkspaceHeaderProps) {
  return (
    <div className="py-6 border-b border-border-subtle mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="accent" size="sm" dot>
            Controlled AI Workspace
          </Badge>
          <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
            UI Architecture Preview
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Document Intelligence Console
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Active Document Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-base border border-border-default text-xs font-mono">
          <span className="text-accent">📄</span>
          <span className="text-text-primary font-medium">{document.filename}</span>
          <span className="text-text-muted">({document.pages} Pages • {document.size})</span>
        </div>

        {/* Clear Session Button */}
        <Button variant="outline" size="sm" onClick={onClearSession}>
          Clear Session Buffer
        </Button>
      </div>
    </div>
  );
}
