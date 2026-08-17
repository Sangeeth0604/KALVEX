"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_PDF_SIZE_LABEL,
  formatBytes,
  validatePdfFile,
} from "@/lib/tools/pdf-assembler/pdf-engine";
import { PdfDocumentItem, PdfError } from "@/lib/tools/pdf-assembler/types";

interface UploadZoneProps {
  documents: PdfDocumentItem[];
  onFilesSelected: (files: File[]) => void;
  onRemoveDocument: (docId: string) => void;
  onError: (error: PdfError) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function UploadZone({
  documents,
  onFilesSelected,
  onRemoveDocument,
  onError,
  disabled = false,
  compact = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const files = Array.from(fileList);

    for (const file of files) {
      const validation = validatePdfFile(file);
      if (!validation.valid && validation.error) {
        onError(validation.error);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  if (compact && documents.length > 0) {
    return (
      <div className="p-4 rounded-xl bg-surface-base border border-border-default shadow-card mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-text-primary">
              Loaded Documents ({documents.length}):
            </span>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-raised border border-border-subtle text-xs font-mono text-text-secondary"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: doc.colorTag }}
                />
                <span className="truncate max-w-[140px] text-text-primary font-medium" title={doc.name}>
                  {doc.name}
                </span>
                <span className="text-text-muted text-[10px]">
                  ({doc.pageCount}p • {formatBytes(doc.size)})
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveDocument(doc.id)}
                  disabled={disabled || documents.length <= 1}
                  className="ml-1 text-text-muted hover:text-error cursor-pointer disabled:opacity-30 transition-colors"
                  title={documents.length <= 1 ? "Cannot remove last document (use reset)" : "Remove document"}
                  aria-label={`Remove ${doc.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled}
            className="shrink-0 font-mono text-xs"
            leftIcon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Add More PDFs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative p-8 sm:p-14 rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-accent ${
        disabled
          ? "opacity-50 pointer-events-none border-border-subtle bg-surface-base/30"
          : isDragOver
          ? "border-accent bg-accent-subtle/15 shadow-accent-glow"
          : "border-border-default hover:border-border-accent/80 bg-surface-base hover:bg-surface-hover/50"
      }`}
      aria-label="Upload PDF files for assembling or splitting"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* PDF Upload Icon */}
      <div className="h-14 w-14 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center text-accent mb-4 transition-transform group-hover:scale-105 shadow-subtle">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>

      <h3 className="text-base sm:text-xl font-bold text-text-primary mb-1.5">
        Upload one or multiple PDF files
      </h3>

      <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
        Drag & drop your PDF files here or select from your device. Merge, reorder, rotate, delete, or extract pages entirely in your browser.
      </p>

      <Button variant="primary" size="md" className="pointer-events-none mb-5 font-bold shadow-subtle">
        Select PDF Files
      </Button>

      {/* Format Specs */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-text-muted">
        <span className="bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
          Multiple PDF Support
        </span>
        <span>•</span>
        <span className="bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
          Max {MAX_PDF_SIZE_LABEL} per file
        </span>
        <span>•</span>
        <span className="text-accent font-medium">100% In-Browser Memory</span>
      </div>
    </div>
  );
}
