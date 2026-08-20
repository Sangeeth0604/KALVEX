"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkspaceDocument } from "@/lib/ai-workspace/types";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

interface WorkspaceHeaderProps {
  document: WorkspaceDocument;
  artifact?: DocumentArtifact | null;
  notFoundId?: string | null;
  onClearSession: () => void;
  onOpenDocument?: () => void;
}

export function WorkspaceHeader({
  document,
  artifact,
  notFoundId,
  onClearSession,
  onOpenDocument,
}: WorkspaceHeaderProps) {
  const isArtifactLoaded = !!artifact;
  const fileName = isArtifactLoaded ? artifact.name : document.filename;
  const sizeLabel = isArtifactLoaded ? formatBytes(artifact.size) : document.size;
  const kindLabel = isArtifactLoaded
    ? artifact.kind.toUpperCase()
    : "PDF";

  return (
    <div className="space-y-4 mb-6">
      {/* Missing/Invalid Artifact Alert (Test C) */}
      {notFoundId && (
        <div className="p-3.5 rounded-xl bg-surface-raised border border-border-default text-xs font-mono text-text-secondary flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-warning">⚠</span>
            <span>
              Artifact <code className="text-text-primary bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle">{notFoundId}</code> was not found in memory (or browser session was reloaded).
            </span>
          </div>
          <span className="text-[11px] text-text-muted">Showing workspace preview</span>
        </div>
      )}

      {/* DOCUMENT RECEIVED Notification Banner when an artifact is active */}
      {isArtifactLoaded && (
        <div className="p-4 sm:p-5 rounded-xl bg-surface-raised border border-border-accent/40 shadow-card animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-lg bg-accent/10 border border-border-accent flex items-center justify-center text-accent shrink-0">
                <span className="text-base font-mono font-bold">✓</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent">
                    DOCUMENT RECEIVED
                  </span>
                  <span className="text-[10px] font-mono text-text-muted bg-surface-base px-2 py-0.2 rounded border border-border-subtle">
                    Via Document Bus
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="font-bold text-text-primary text-sm truncate max-w-[280px]">
                    {artifact.name}
                  </span>
                  <span className="text-text-muted">•</span>
                  <span className="text-accent font-semibold">{kindLabel}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-secondary">{sizeLabel}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-muted">Source: <strong className="text-text-primary">{artifact.sourceTool}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              {onOpenDocument && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenDocument}
                  className="font-mono text-xs font-bold shadow-subtle"
                >
                  Open Document
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSession}
                className="font-mono text-xs text-error hover:text-error hover:border-error/40"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Titlebar */}
      <div className="py-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="accent" size="sm" dot>
              Controlled AI Workspace
            </Badge>
            {isArtifactLoaded ? (
              <span className="text-xs font-mono text-accent bg-accent-subtle/50 px-2 py-0.5 rounded border border-border-accent font-bold">
                ✓ Artifact Ingested
              </span>
            ) : (
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                UI Architecture Preview
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Document Intelligence Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Document Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-base border border-border-default text-xs font-mono">
            <span className="text-accent">📄</span>
            <span className="text-text-primary font-medium truncate max-w-[180px]" title={fileName}>
              {fileName}
            </span>
            <span className="text-text-muted">
              ({isArtifactLoaded ? kindLabel : `${document.pages} Pages`} • {sizeLabel})
            </span>
          </div>

          {/* Clear Session Button */}
          <Button variant="outline" size="sm" onClick={onClearSession} className="font-mono text-xs">
            Clear Session
          </Button>
        </div>
      </div>
    </div>
  );
}
