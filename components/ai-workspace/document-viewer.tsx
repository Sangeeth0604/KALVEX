"use client";

import React, { useState, useRef } from "react";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { DocumentContext, WorkspaceDocument } from "@/lib/ai-workspace/types";

interface DocumentViewerProps {
  document: WorkspaceDocument;
  artifact?: DocumentArtifact | null;
  context?: DocumentContext | null;
  selectedSectionId?: string | null;
  onSelectSection: (sectionId: string) => void;
  onUploadFile?: (file: File) => void;
}

export function DocumentViewer({
  document,
  context,
  selectedSectionId,
  onSelectSection,
  onUploadFile,
}: DocumentViewerProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile?.(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile?.(e.target.files[0]);
    }
  };

  // If a real DocumentContext is prepared
  if (context) {
    const rawText = context.extractedText || "";
    const allParagraphs = rawText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const filteredParagraphs = filterQuery.trim()
      ? allParagraphs.filter((p) =>
          p.toLowerCase().includes(filterQuery.toLowerCase())
        )
      : allParagraphs;

    return (
      <div className="flex flex-col h-full rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
        {/* Titlebar */}
        <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
              Document Context Inspector
            </span>
            <span className="text-[10px] font-mono text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-border-accent-subtle font-semibold">
              {context.extractionMethod === "digital_text"
                ? "Digital PDF Stream"
                : context.extractionMethod === "local_ocr"
                ? "Local WASM OCR"
                : "Direct Text"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            {context.pageCount} {context.pageCount === 1 ? "Page" : "Pages"} • {context.totalCharacters.toLocaleString()} Chars
          </span>
        </div>

        {/* Metrics Summary Strip */}
        <div className="p-3 bg-surface-raised/40 border-b border-border-subtle grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-text-muted">Tokens: </span>
            <span className="text-accent font-bold">~{context.estimatedTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-text-muted">Extracted in: </span>
            <span className="text-text-primary font-bold">{context.extractionDurationMs} ms</span>
          </div>
          <div>
            <span className="text-text-muted">Format: </span>
            <span className="text-text-primary uppercase font-bold">{context.kind}</span>
          </div>
        </div>

        {/* Search / Filter Filter */}
        <div className="p-2.5 bg-surface-base border-b border-border-subtle">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search extracted text blocks..."
            className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-lg text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border-subtle/50 max-h-[520px]">
          {filteredParagraphs.length > 0 ? (
            filteredParagraphs.map((para, idx) => {
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
                      {para.length} Chars
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed font-mono whitespace-pre-wrap">
                    {para}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs font-mono text-text-muted">
              No matching text blocks found
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-surface-raised/60 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            100% In-Browser Context Extraction
          </span>
          <span>Zero Disk Storage</span>
        </div>
      </div>
    );
  }

  // Fallback view with direct upload dropzone + sample preview
  return (
    <div className="flex flex-col h-full rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
      {/* Titlebar */}
      <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
            Source Document Inspector
          </span>
          <span className="text-[10px] font-mono text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-border-accent-subtle font-semibold">
            Interactive Workspace
          </span>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          Ready for Analysis
        </span>
      </div>

      {/* Direct Ingestion Dropzone */}
      <div className="p-4 border-b border-border-subtle bg-surface-raised/30">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-5 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer ${
            isDragging
              ? "border-accent bg-accent-subtle/30"
              : "border-border-default hover:border-border-accent/60 bg-surface-base/80"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-surface-raised border border-border-default flex items-center justify-center text-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-text-primary">
                Drop any PDF, Image, or Text file here
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Parsed 100% locally in browser memory
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Document Notice & Clauses */}
      <div className="p-3 bg-surface-raised/40 border-b border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
        <span>Sample Interactive Document:</span>
        <span className="text-accent font-semibold">{document.title}</span>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border-subtle/50 max-h-[460px]">
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
