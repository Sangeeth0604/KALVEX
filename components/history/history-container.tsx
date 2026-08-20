"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryCard } from "./history-card";
import { HistoryCategoryFilter, HistoryEntry } from "@/lib/history/types";
import { historyManager } from "@/lib/history";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

export function HistoryContainer() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => historyManager.getEntries());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HistoryCategoryFilter>("all");
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  useEffect(() => {
    const unsubscribe = historyManager.subscribe((updatedList) => {
      setEntries(updatedList);
    });

    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    let totalBytesSaved = 0;
    let totalDurationMs = 0;
    let successfulOperations = 0;
    let failedOperations = 0;
    let activeSessionArtifactsCount = 0;

    for (const e of entries) {
      if (e.status === "success") {
        successfulOperations++;
      } else {
        failedOperations++;
      }
      if (e.reductionBytes && e.reductionBytes > 0) {
        totalBytesSaved += e.reductionBytes;
      }
      if (e.durationMs && e.durationMs > 0) {
        totalDurationMs += e.durationMs;
      }
      if (e.busArtifactId) {
        activeSessionArtifactsCount++;
      }
    }

    return {
      totalOperations: entries.length,
      successfulOperations,
      failedOperations,
      totalBytesSaved,
      totalDurationMs,
      activeSessionArtifactsCount,
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Category match
      if (activeCategory === "compress" && e.operationType !== "compress" && e.operationType !== "optimize") {
        return false;
      }
      if (activeCategory === "convert" && e.operationType !== "convert" && e.operationType !== "assemble" && e.operationType !== "split") {
        return false;
      }
      if (activeCategory === "ocr" && e.operationType !== "ocr") {
        return false;
      }
      if (activeCategory === "ai" && !e.operationType.startsWith("ai_")) {
        return false;
      }
      if (activeCategory === "workflow" && e.operationType !== "workflow_run") {
        return false;
      }

      // Query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFilename = e.inputFilename.toLowerCase().includes(q) || e.outputFilename.toLowerCase().includes(q);
        const matchesTool = e.sourceTool.toLowerCase().includes(q);
        const matchesOutcome = e.outcome.toLowerCase().includes(q);
        return matchesFilename || matchesTool || matchesOutcome;
      }

      return true;
    });
  }, [entries, activeCategory, searchQuery]);

  const handleRemove = (id: string) => {
    historyManager.removeEntry(id);
  };

  const handleClearAll = () => {
    historyManager.clearHistory();
    setIsConfirmingClear(false);
  };

  return (
    <div className="py-8 pb-20">
      <Container size="xl" className="space-y-6">
        {/* Header Titlebar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="accent" size="sm" dot>
                Local Activity Log
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                🔒 In-Browser Storage • Zero Cloud Binaries
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
              Operation History
            </h1>
            <p className="text-xs text-text-muted mt-1 font-mono">
              Chronological log of document operations, compressions, and AI extractions in this browser.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              isConfirmingClear ? (
                <div className="flex items-center gap-2 bg-error/10 p-1 rounded-lg border border-error/30">
                  <span className="text-xs font-mono text-error px-2 font-bold">Clear All History?</span>
                  <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs font-mono text-error border-error/50 hover:bg-error/10">
                    Yes, Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsConfirmingClear(false)} className="text-xs font-mono">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmingClear(true)}
                  className="font-mono text-xs text-text-muted hover:text-error"
                >
                  Clear History
                </Button>
              )
            )}
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-base border border-border-default shadow-card">
            <div className="text-[11px] font-mono text-text-muted">Total Operations</div>
            <div className="text-2xl font-mono font-extrabold text-text-primary mt-1">
              {metrics.totalOperations}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-base border border-border-default shadow-card">
            <div className="text-[11px] font-mono text-text-muted">Total Storage Saved</div>
            <div className="text-2xl font-mono font-extrabold text-accent mt-1">
              {formatBytes(metrics.totalBytesSaved)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-base border border-border-default shadow-card">
            <div className="text-[11px] font-mono text-text-muted">Successful Runs</div>
            <div className="text-2xl font-mono font-extrabold text-text-primary mt-1">
              {metrics.successfulOperations}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-base border border-border-default shadow-card">
            <div className="text-[11px] font-mono text-text-muted">Active in RAM</div>
            <div className="text-2xl font-mono font-extrabold text-accent mt-1">
              {metrics.activeSessionArtifactsCount}
            </div>
          </div>
        </div>

        {/* Search Filter & Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-surface-raised rounded-lg border border-border-subtle">
            {(
              [
                { key: "all", label: "All Activity" },
                { key: "compress", label: "Compress" },
                { key: "convert", label: "Convert" },
                { key: "ocr", label: "OCR" },
                { key: "ai", label: "AI Operations" },
                { key: "workflow", label: "Workflows" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1 text-xs font-mono rounded capitalize transition-colors cursor-pointer ${
                  activeCategory === cat.key
                    ? "bg-surface-base text-accent font-bold shadow-subtle"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by filename or tool..."
              className="w-full px-3 py-1.5 bg-surface-base border border-border-default rounded-lg text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Activity Timeline List */}
        <div className="space-y-3 pt-2">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} onRemove={handleRemove} />
            ))
          ) : (
            <div className="p-12 text-center rounded-xl bg-surface-base border border-border-default space-y-3 font-mono">
              <span className="text-3xl block">📜</span>
              <h3 className="text-sm font-bold text-text-primary">
                {entries.length === 0
                  ? "No document activity recorded in this browser session."
                  : `No activity found matching filter "${activeCategory}".`}
              </h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {entries.length === 0
                  ? "Operations performed in KALVEX tools and the AI Workspace will automatically appear here."
                  : "Try selecting another category filter or clearing the search term."}
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
