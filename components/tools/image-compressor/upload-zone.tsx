"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_FILE_SIZE_LABEL,
  validateImageFile,
} from "@/lib/tools/image-compressor/image-compressor";
import { CompressionError } from "@/lib/tools/image-compressor/types";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onError: (error: CompressionError) => void;
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
    const validation = validateImageFile(file);
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
      // Reset input value so re-selecting the same file triggers change
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
      className={`relative p-8 sm:p-12 rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-accent ${
        disabled
          ? "opacity-50 pointer-events-none border-border-subtle bg-surface-base/30"
          : isDragOver
          ? "border-accent bg-accent-subtle/15 shadow-accent-glow"
          : "border-border-default hover:border-border-accent/80 bg-surface-base hover:bg-surface-hover/50"
      }`}
      aria-label="Upload image for compression"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
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
        Choose an image or drag it here
      </h3>

      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-5 leading-relaxed">
        Select a raster image to compress directly in your browser. No files are uploaded to any server.
      </p>

      <Button variant="primary" size="md" className="pointer-events-none mb-4">
        Select Image File
      </Button>

      {/* Format Specs */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-text-muted">
        <span className="bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
          PNG, JPG, JPEG, WEBP
        </span>
        <span>•</span>
        <span className="bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
          Max {MAX_FILE_SIZE_LABEL}
        </span>
        <span>•</span>
        <span className="text-accent">100% Local</span>
      </div>
    </div>
  );
}
