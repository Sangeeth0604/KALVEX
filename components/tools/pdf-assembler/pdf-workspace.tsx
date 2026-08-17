"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PdfPageThumbnail } from "./pdf-page-thumbnail";
import { PdfPageItem } from "@/lib/tools/pdf-assembler/types";

interface PdfWorkspaceProps {
  pages: PdfPageItem[];
  onToggleSelectPage: (pageId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRotatePage: (pageId: string) => void;
  onRotateSelected: () => void;
  onMovePageLeft: (pageId: string) => void;
  onMovePageRight: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onDeleteSelected: () => void;
  onExportAll: () => void;
  onExtractSelected: () => void;
  isProcessing: boolean;
}

export function PdfWorkspace({
  pages,
  onToggleSelectPage,
  onSelectAll,
  onClearSelection,
  onRotatePage,
  onRotateSelected,
  onMovePageLeft,
  onMovePageRight,
  onDeletePage,
  onDeleteSelected,
  onExportAll,
  onExtractSelected,
  isProcessing,
}: PdfWorkspaceProps) {
  const selectedPages = pages.filter((p) => p.isSelected);
  const selectedCount = selectedPages.length;
  const hasSelection = selectedCount > 0;
  const isAllSelected = pages.length > 0 && selectedCount === pages.length;

  return (
    <div className="rounded-xl border border-border-default bg-surface-base shadow-card p-4 sm:p-6 mb-8">
      {/* Workspace Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-border-subtle">
        {/* Left: Summary & Selection State */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-text-primary">
            Workspace:
          </span>
          <span className="text-xs font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle font-medium">
            {pages.length} {pages.length === 1 ? "Page" : "Pages"} Total
          </span>

          {hasSelection && (
            <span className="text-xs font-mono text-text-primary bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
              {selectedCount} Selected
            </span>
          )}

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              disabled={isProcessing || pages.length === 0}
              className="text-xs font-mono text-text-secondary hover:text-accent disabled:opacity-40 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-surface-hover border border-border-subtle"
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>

            {hasSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                disabled={isProcessing}
                className="text-xs font-mono text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-surface-hover border border-border-subtle"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Batch Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rotate Selected */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRotateSelected}
            disabled={isProcessing || !hasSelection}
            className="font-mono text-xs"
            leftIcon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Rotate Selected (90°)
          </Button>

          {/* Delete Selected */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onDeleteSelected}
            disabled={isProcessing || !hasSelection || pages.length <= selectedCount}
            className="font-mono text-xs text-error hover:text-error hover:border-error/40"
            leftIcon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            title={pages.length <= selectedCount ? "Cannot delete all pages (keep at least one)" : "Delete selected pages"}
          >
            Delete Selected ({selectedCount})
          </Button>

          {/* Extract Selected */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onExtractSelected}
            disabled={isProcessing || !hasSelection}
            className="font-mono text-xs text-text-primary"
            leftIcon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          >
            Extract Selected ({selectedCount})
          </Button>

          {/* Assemble & Export All */}
          <Button
            variant="primary"
            size="sm"
            onClick={onExportAll}
            disabled={isProcessing || pages.length === 0}
            className="font-mono text-xs font-bold shadow-subtle"
            leftIcon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            Export All Pages ({pages.length})
          </Button>
        </div>
      </div>

      {/* Pages Grid Matrix */}
      {pages.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm font-mono">
          No pages currently in workspace. Upload a PDF file to begin.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pages.map((page, idx) => (
            <PdfPageThumbnail
              key={page.id}
              page={page}
              displayNumber={idx + 1}
              isFirst={idx === 0}
              isLast={idx === pages.length - 1}
              onToggleSelect={onToggleSelectPage}
              onRotate={onRotatePage}
              onMoveLeft={onMovePageLeft}
              onMoveRight={onMovePageRight}
              onDelete={onDeletePage}
              disabled={isProcessing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
