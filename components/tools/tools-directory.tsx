"use client";

import React, { useState, useMemo } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ToolsHeader } from "./tools-header";
import { ToolCard } from "./tool-card";
import {
  TOOLS_DATA,
  getCategoryList,
  filterTools,
} from "@/lib/tools/tool-data";
import { ToolCategory, FormatGroup } from "@/lib/tools/types";

export function ToolsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | ToolCategory>("all");
  const [activeFormat, setActiveFormat] = useState<FormatGroup>("all");

  const categories = useMemo(() => getCategoryList(), []);

  const filteredTools = useMemo(() => {
    return filterTools(TOOLS_DATA, searchQuery, activeCategory, activeFormat);
  }, [searchQuery, activeCategory, activeFormat]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setActiveFormat("all");
  };

  return (
    <div className="pb-20">
      <Container size="xl">
        {/* Header with Search & Format Quick-Chips */}
        <ToolsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFormat={activeFormat}
          onFormatChange={setActiveFormat}
        />

        {/* Category Tabs & Count Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-mono uppercase tracking-wider rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-surface-raised text-accent border-border-accent shadow-subtle"
                      : "bg-surface-base text-text-secondary border-border-default hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-accent-subtle text-accent" : "bg-surface-raised text-text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono text-text-muted">
            <span>
              Showing <strong className="text-text-primary">{filteredTools.length}</strong> of{" "}
              {TOOLS_DATA.length} tools
            </span>

            {(searchQuery || activeCategory !== "all" || activeFormat !== "all") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-accent hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tool Grid or Empty State */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-xl border border-dashed border-border-default bg-surface-base/50 max-w-xl mx-auto p-8">
            <p className="text-sm font-semibold text-text-primary mb-1">
              No matching tools found
            </p>
            <p className="text-xs text-text-secondary mb-5">
              Try searching with different terms or reset your filters.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset All Filters
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
