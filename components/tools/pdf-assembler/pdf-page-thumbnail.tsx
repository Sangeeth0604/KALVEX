"use client";

import React from "react";
import { PdfPageItem } from "@/lib/tools/pdf-assembler/types";

interface PdfPageThumbnailProps {
  page: PdfPageItem;
  displayNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onToggleSelect: (pageId: string) => void;
  onRotate: (pageId: string) => void;
  onMoveLeft: (pageId: string) => void;
  onMoveRight: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  disabled?: boolean;
}

export function PdfPageThumbnail({
  page,
  displayNumber,
  isFirst,
  isLast,
  onToggleSelect,
  onRotate,
  onMoveLeft,
  onMoveRight,
  onDelete,
  disabled = false,
}: PdfPageThumbnailProps) {
  const formattedNumber = displayNumber < 10 ? `0${displayNumber}` : `${displayNumber}`;
  const normalizedRotation = ((page.rotation % 360) + 360) % 360;

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking a button or checkbox directly, do not duplicate toggle
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) {
      return;
    }
    if (!disabled) {
      onToggleSelect(page.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggleSelect(page.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
        page.isSelected
          ? "border-accent bg-accent-subtle/10 shadow-[0_0_15px_rgba(0,245,155,0.15)] ring-2 ring-accent"
          : "border-border-default hover:border-border-accent/80 bg-surface-base hover:bg-surface-hover/30 shadow-card"
      }`}
      aria-label={`PDF Page ${displayNumber}, from ${page.docName}${page.isSelected ? ", selected" : ""}`}
    >
      {/* Top Header Strip */}
      <div className="p-2 bg-surface-raised border-b border-border-subtle flex items-center justify-between gap-1.5 text-xs font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <input
            type="checkbox"
            checked={page.isSelected}
            disabled={disabled}
            onChange={() => onToggleSelect(page.id)}
            className="h-3.5 w-3.5 rounded accent-accent cursor-pointer disabled:opacity-50"
            aria-label={`Select page ${displayNumber}`}
          />
          <span className="font-bold text-text-primary text-[11px]">
            P.{formattedNumber}
          </span>
        </div>

        <div className="flex items-center gap-1 min-w-0" title={page.docName}>
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: page.colorTag }}
          />
          <span className="text-[10px] text-text-muted truncate max-w-[80px]">
            {page.docName}
          </span>
        </div>
      </div>

      {/* Page Preview Thumbnail Container */}
      <div className="relative p-3.5 flex items-center justify-center min-h-[190px] max-h-[220px] bg-surface-base/80 overflow-hidden">
        {/* Subtle checkered pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "12px 12px",
          }}
        />

        {page.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={page.thumbnailUrl}
            alt={`Page ${displayNumber}`}
            style={{
              transform: `rotate(${normalizedRotation}deg)`,
              transition: "transform 0.2s ease-in-out",
            }}
            className="max-h-[160px] max-w-[130px] object-contain rounded shadow-subtle border border-border-subtle bg-white"
          />
        ) : (
          /* Fallback clean vector document placeholder */
          <div
            style={{
              transform: `rotate(${normalizedRotation}deg)`,
              transition: "transform 0.2s ease-in-out",
            }}
            className="h-[150px] w-[110px] rounded bg-surface-raised border border-border-subtle flex flex-col items-center justify-center p-2 text-center shadow-subtle"
          >
            <svg
              className="h-8 w-8 text-text-muted mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-[10px] font-mono text-text-muted">
              PDF Page {page.originalPageIndex + 1}
            </span>
          </div>
        )}

        {/* Rotation indicator badge if rotated */}
        {normalizedRotation !== 0 && (
          <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold bg-accent text-accent-foreground px-1.5 py-0.2 rounded shadow-subtle">
            {normalizedRotation}°
          </span>
        )}
      </div>

      {/* Bottom Floating/Hover Actions */}
      <div className="p-1.5 bg-surface-raised border-t border-border-subtle flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-0.5">
          {/* Move Left */}
          <button
            type="button"
            disabled={disabled || isFirst}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft(page.id);
            }}
            className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
            title="Move Page Left"
            aria-label={`Move page ${displayNumber} left`}
          >
            ←
          </button>

          {/* Move Right */}
          <button
            type="button"
            disabled={disabled || isLast}
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight(page.id);
            }}
            className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
            title="Move Page Right"
            aria-label={`Move page ${displayNumber} right`}
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Rotate 90 deg */}
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onRotate(page.id);
            }}
            className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-accent hover:bg-surface-hover cursor-pointer transition-colors"
            title="Rotate 90° Clockwise"
            aria-label={`Rotate page ${displayNumber} 90 degrees`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Delete Page */}
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(page.id);
            }}
            className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-error hover:bg-error-subtle/50 cursor-pointer transition-colors"
            title="Delete Page"
            aria-label={`Delete page ${displayNumber}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
