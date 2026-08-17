"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_PDF_SIZE_LABEL,
  validatePdfFile,
} from "@/lib/tools/pdf-optimizer/pdf-engine";
import { PdfOptimizerError } from "@/lib/tools/pdf-optimizer/types";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onError: (error: PdfOptimizerError) => void;
  disabled?: boolean;
}

export function UploadZone({
  onFileSelected,
  onError,
  disabled = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const validation = validatePdfFile(file);
    if (!validation.valid && validation.error) {
      onError(validation.error);
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
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
      const file = e.target.files[0];
      handleFile(file);
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
      aria-label="Upload PDF document for optimization"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* PDF Optimizer Graphic Icon */}
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
          <path d="m9 15 3-3 3 3" />
          <path d="M12 12v6" />
        </svg>
      </div>

      <h3 className="text-base sm:text-xl font-bold text-text-primary mb-1.5">
        Choose a PDF document or drag it here
      </h3>

      <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
        Optimize PDF streams, compress object tables, prune orphaned revisions, and remove metadata locally in your browser memory.
      </p>

      <Button variant="primary" size="md" className="pointer-events-none mb-5 font-bold shadow-subtle">
        Select PDF File
      </Button>

      {/* Specs Badge Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-text-muted">
        <span className="bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
          PDF Document (.pdf)
        </span>
        <span>•</span>
        <span className="bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
          Max {MAX_PDF_SIZE_LABEL}
        </span>
        <span>•</span>
        <span className="text-accent font-medium">100% In-Memory Processing</span>
      </div>
    </div>
  );
}
