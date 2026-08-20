"use client";

import React from "react";
import { WorkspaceDocument } from "@/lib/ai-workspace/types";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

interface DocumentViewerProps {
  document: WorkspaceDocument;
  artifact?: DocumentArtifact | null;
  selectedSectionId?: string | null;
  onSelectSection: (sectionId: string) => void;
}

export function DocumentViewer({
  document,
  artifact,
  selectedSectionId,
  onSelectSection,
}: DocumentViewerProps) {
  // If a real artifact was transferred from the Document Bus
  if (artifact) {
    const rawText = artifact.metadata?.text || "";
    const hasText = rawText.trim().length > 0;
    const textParagraphs = hasText
      ? rawText.split(/\n\n+/).filter((p) => p.trim().length > 0)
      : [];

    return (
      <div className="flex flex-col h-full rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
        {/* Titlebar */}
        <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
              Source Document Inspector
            </span>
            <span className="text-[10px] font-mono text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-border-accent-subtle font-semibold">
              Live Ingestion
            </span>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            {hasText
              ? `${textParagraphs.length} Text Blocks Indexed`
              : `${artifact.kind.toUpperCase()} Binary Document`}
          </span>
        </div>

        {/* Transferred Artifact Metadata Summary */}
        <div className="p-3 bg-surface-raised/40 border-b border-border-subtle grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-text-muted">File: </span>
            <span
              className="text-text-primary font-bold truncate max-w-[140px] inline-block align-bottom"
              title={artifact.name}
            >
              {artifact.name}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Size: </span>
            <span className="text-text-primary font-bold">{formatBytes(artifact.size)}</span>
          </div>
          <div>
            <span className="text-text-muted">Format: </span>
            <span className="text-text-primary uppercase">{artifact.kind}</span>
          </div>
          <div>
            <span className="text-text-muted">Source: </span>
            <span className="text-accent font-bold">{artifact.sourceTool}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border-subtle/50 max-h-[580px]">
          {hasText ? (
            textParagraphs.map((para, idx) => {
              const secId = `block-${idx + 1}`;
              const isSelected = selectedSectionId === secId;
              return (
                <div
                  key={secId}
                  onClick={() => onSelectSection(secId)}
                  className={`pt-3 first:pt-0 p-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent-subtle/40 border border-border-accent"
                      : "hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-accent bg-surface-raised px-1.5 py-0.5 rounded border border-border-subtle">
                      Block #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {para.length} Characters
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-mono whitespace-pre-wrap">
                    {para}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center space-y-4 font-mono">
              {artifact.previewUrl && (
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artifact.previewUrl}
                    alt={artifact.name}
                    className="max-h-[220px] max-w-full rounded border border-border-subtle bg-white shadow-subtle object-contain"
                  />
                </div>
              )}
              <div className="text-xs text-text-secondary">
                <p className="font-bold text-text-primary mb-1">
                  Document Payload Buffered in RAM
                </p>
                <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                  Binary payload ({formatBytes(artifact.size)}) received from {artifact.sourceTool}. Ready for client session inspection without server transmission.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-surface-raised/60 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Isolated Memory Buffer
          </span>
          <span>Zero Server Storage</span>
        </div>
      </div>
    );
  }

  // Fallback to sample document architecture preview
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
