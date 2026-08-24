"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/tools/target-size-compressor/engine";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  selectedFile?: File | null;
  onClear?: () => void;
}

export function UploadZone({
  onFileSelect,
  disabled = false,
  selectedFile,
  onClear,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
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

  if (selectedFile) {
    return (
      <div className="p-5 rounded-xl border border-border-default bg-surface-base flex items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-surface-raised border border-border-default flex items-center justify-center text-accent font-bold font-mono text-sm shrink-0">
            {selectedFile.name.toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-text-primary truncate">
              {selectedFile.name}
            </h4>
            <div className="flex items-center gap-2 text-xs font-mono text-text-muted mt-0.5">
              <span>{formatBytes(selectedFile.size)}</span>
              <span>•</span>
              <span className="uppercase">{selectedFile.type || "Document"}</span>
            </div>
          </div>
        </div>

        {onClear && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-mono text-text-muted hover:text-error px-2.5 py-1 rounded border border-border-subtle hover:border-error/40 transition-colors cursor-pointer shrink-0"
          >
            Change File
          </button>
        )}
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
      className={`relative p-8 sm:p-12 rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-accent ${
        disabled
          ? "opacity-50 pointer-events-none border-border-subtle bg-surface-base/30"
          : isDragOver
          ? "border-accent bg-accent-subtle/15 shadow-accent-glow"
          : "border-border-default hover:border-border-accent/80 bg-surface-base hover:bg-surface-hover/50"
      }`}
      aria-label="Upload file for 1 MB compression"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Upload Icon */}
      <div className="h-12 w-12 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center text-accent mb-4 transition-transform group-hover:scale-105">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1.5">
        Choose a file or drag it here
      </h3>

      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-5 leading-relaxed">
        Compress images or PDF documents to 1 MB or your desired file size.
      </p>

      <Button variant="primary" size="md" className="pointer-events-none mb-4">
        Select File
      </Button>

      {/* Format Specs */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-text-muted">
        <span className="bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
          JPG, JPEG, PNG, WEBP, PDF
        </span>
        <span>•</span>
        <span className="bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
          Default 1 MB
        </span>
        <span>•</span>
        <span className="text-accent">100% Local</span>
      </div>
    </div>
  );
}
