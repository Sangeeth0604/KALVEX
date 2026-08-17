import React from "react";
import { Badge } from "@/components/ui/badge";
import { FORMAT_FILTERS } from "@/lib/tools/tool-data";
import { FormatGroup } from "@/lib/tools/types";

interface ToolsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFormat: FormatGroup;
  onFormatChange: (format: FormatGroup) => void;
}

export function ToolsHeader({
  searchQuery,
  onSearchChange,
  activeFormat,
  onFormatChange,
}: ToolsHeaderProps) {
  return (
    <div className="pt-10 pb-8 border-b border-border-subtle mb-8">
      {/* Title Block */}
      <div className="max-w-3xl mb-8">
        <Badge variant="accent" size="md" dot className="mb-4">
          Tools Directory
        </Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight mb-3">
          The Privacy-First Document & File Engine.
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Discover client-side and zero-retention tools across conversion, compression, creation,
          and document understanding.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools by name, format (pdf, docx), or engine..."
            className="w-full pl-10 pr-10 py-2.5 bg-surface-base border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary cursor-pointer"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Format Quick-Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-mono uppercase text-text-muted mr-1 whitespace-nowrap">
          Formats:
        </span>
        {FORMAT_FILTERS.map((format) => {
          const isActive = activeFormat === format.key;
          return (
            <button
              key={format.key}
              type="button"
              onClick={() => onFormatChange(format.key)}
              className={`px-3 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-accent-subtle text-accent border-border-accent font-medium"
                  : "bg-surface-raised text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong"
              }`}
            >
              {format.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
