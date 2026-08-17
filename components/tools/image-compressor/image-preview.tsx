"use client";

import React from "react";
import { ImageMetadata } from "@/lib/tools/image-compressor/types";
import { formatBytes } from "@/lib/tools/image-compressor/image-compressor";

interface ImagePreviewProps {
  metadata: ImageMetadata;
  onChangeImage: () => void;
  disabled?: boolean;
}

export function ImagePreview({
  metadata,
  onChangeImage,
  disabled = false,
}: ImagePreviewProps) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
            Original Image
          </span>
          <span className="text-[10px] font-mono text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-border-accent-subtle">
            Loaded in RAM
          </span>
        </div>

        <button
          type="button"
          onClick={onChangeImage}
          disabled={disabled}
          className="text-xs font-mono text-text-secondary hover:text-accent disabled:opacity-50 cursor-pointer transition-colors"
        >
          Change File
        </button>
      </div>

      {/* Image Preview Canvas / Container */}
      <div className="relative bg-surface-base/80 p-4 flex items-center justify-center min-h-[220px] max-h-[340px] overflow-hidden border-b border-border-subtle">
        {/* Subtle checkered pattern backdrop for transparent images */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={metadata.objectUrl}
          alt={metadata.name}
          className="max-h-[300px] max-w-full object-contain rounded-lg shadow-subtle border border-border-subtle/50"
        />
      </div>

      {/* Metadata Specification Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-base text-xs font-mono">
        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Size</span>
          <span className="text-text-primary font-bold">{formatBytes(metadata.size)}</span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Dimensions</span>
          <span className="text-text-primary font-bold truncate">
            {metadata.width} × {metadata.height}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Ratio</span>
          <span className="text-text-primary font-bold">{metadata.aspectRatio}</span>
        </div>

        <div className="p-2.5 rounded bg-surface-raised border border-border-subtle">
          <span className="text-[10px] text-text-muted uppercase block mb-0.5">Format</span>
          <span className="text-accent font-bold truncate">
            {metadata.type.split("/")[1]?.toUpperCase() || "IMAGE"}
          </span>
        </div>
      </div>
    </div>
  );
}
