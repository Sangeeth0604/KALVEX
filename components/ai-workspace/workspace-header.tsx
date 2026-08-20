"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { DocumentContext, ProcessingPrivacyLevel } from "@/lib/ai-workspace/types";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

interface WorkspaceHeaderProps {
  artifact?: DocumentArtifact | null;
  context?: DocumentContext | null;
  privacyLevel: ProcessingPrivacyLevel;
  notFoundId?: string | null;
  onClearSession: () => void;
  onOpenDocument?: () => void;
}

export function WorkspaceHeader({
  artifact,
  context,
  privacyLevel,
  notFoundId,
  onClearSession,
  onOpenDocument,
}: WorkspaceHeaderProps) {
  const isLoaded = !!artifact || !!context;
  const fileName = artifact?.name || context?.filename || "Sample Enterprise Contract.pdf";
  const sizeLabel = artifact ? formatBytes(artifact.size) : context ? `${Math.ceil(context.totalCharacters / 1024)} KB` : "1.8 MB";
  const kindLabel = (artifact?.kind || context?.kind || "pdf").toUpperCase();
  const tokenLabel = context ? `~${context.estimatedTokens.toLocaleString()} Tokens` : null;

  return (
    <div className="space-y-4 mb-6">
      {/* Missing/Invalid Artifact Alert */}
      {notFoundId && (
        <div className="p-3.5 rounded-xl bg-surface-raised border border-border-default text-xs font-mono text-text-secondary flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-warning">⚠</span>
            <span>
              Artifact <code className="text-text-primary bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle">{notFoundId}</code> was not found in memory (or browser session was refreshed).
            </span>
          </div>
          <span className="text-[11px] text-text-muted">Showing workspace preview</span>
        </div>
      )}

      {/* DOCUMENT RECEIVED Notification Banner when an artifact is active */}
      {isLoaded && artifact && (
        <div className="p-4 sm:p-5 rounded-xl bg-surface-raised border border-border-accent/40 shadow-card animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-lg bg-accent/10 border border-border-accent flex items-center justify-center text-accent shrink-0">
                <span className="text-base font-mono font-bold">✓</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent">
                    DOCUMENT RECEIVED
                  </span>
                  <span className="text-[10px] font-mono text-text-muted bg-surface-base px-2 py-0.2 rounded border border-border-subtle">
                    Via Document Bus
                  </span>
                  {context && (
                    <span className="text-[10px] font-mono text-text-secondary bg-surface-base px-2 py-0.2 rounded border border-border-subtle">
                      {context.extractionMethod === "digital_text" ? "Digital PDF Text" : context.extractionMethod === "local_ocr" ? "WASM OCR" : "Direct Text"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="font-bold text-text-primary text-sm truncate max-w-[280px]">
                    {artifact.name}
                  </span>
                  <span className="text-text-muted">•</span>
                  <span className="text-accent font-semibold">{kindLabel}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-secondary">{sizeLabel}</span>
                  {tokenLabel && (
                    <>
                      <span className="text-text-muted">•</span>
                      <span className="text-text-primary font-bold">{tokenLabel}</span>
                    </>
                  )}
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
                  Inspect Text
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

      {/* Main Titlebar with Truthful Privacy State */}
      <div className="py-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="accent" size="sm" dot>
              Controlled AI Workspace
            </Badge>

            {/* Truthful Privacy State Badge */}
            {privacyLevel === "AI_CLOUD_TRANSIT" ? (
              <span className="text-xs font-mono text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/40 font-bold animate-pulse">
                ⚡ CLOUD AI PROCESSING (Secure TLS 1.3)
              </span>
            ) : privacyLevel === "AI_COMPLETED" ? (
              <span className="text-xs font-mono text-accent bg-accent-subtle/50 px-2 py-0.5 rounded border border-border-accent font-bold">
                ✓ AI Result Buffered in RAM
              </span>
            ) : (
              <span className="text-xs font-mono text-text-secondary bg-surface-raised px-2 py-0.5 rounded border border-border-subtle font-semibold">
                🔒 LOCAL EXTRACTION: 100% In-Browser RAM
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
              ({kindLabel} • {sizeLabel})
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
