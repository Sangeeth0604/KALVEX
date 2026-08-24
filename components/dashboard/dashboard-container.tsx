"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { historyManager } from "@/lib/history";
import { HistoryEntry } from "@/lib/history/types";
import { workflowManager } from "@/lib/workflows/workflow-manager";
import { SavedWorkflow } from "@/lib/workflows/types";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

interface ToolCardInfo {
  id: string;
  name: string;
  category: "Convert" | "Compress" | "Create" | "Understand";
  description: string;
  href: string;
  badge: string;
  icon: string;
}

const DASHBOARD_TOOLS: ToolCardInfo[] = [
  {
    id: "diff-analyzer",
    name: "Difference Analyzer",
    category: "Understand",
    description: "Compare revisions of PDF, DOCX, and text documents with word-level precision.",
    href: "/tools/diff-analyzer",
    badge: "Updated",
    icon: "🔍",
  },
  {
    id: "table-parser",
    name: "Tabular Parser",
    category: "Understand",
    description: "Extract structured tables from PDF invoices into clean CSV and Excel spreadsheets.",
    href: "/tools/table-parser",
    badge: "Smart Grid",
    icon: "📊",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    category: "Compress",
    description: "Format-preserving lossless compression for JPEG, PNG, and WEBP images in browser RAM.",
    href: "/tools/image-compressor",
    badge: "Zero-Bloat",
    icon: "🗜️",
  },
  {
    id: "pdf-to-office",
    name: "PDF to Office",
    category: "Convert",
    description: "Convert text-based and scanned PDFs into Microsoft Word (.docx) and Excel (.xlsx).",
    href: "/tools/pdf-to-office",
    badge: "WASM Engine",
    icon: "📄",
  },
  {
    id: "pdf-optimizer",
    name: "PDF Optimizer",
    category: "Compress",
    description: "Shrink bloated PDF streams, uncompressed fonts, and redundant metadata safely.",
    href: "/tools/pdf-optimizer",
    badge: "Lossless",
    icon: "⚡",
  },
  {
    id: "document-sanitizer",
    name: "Document Sanitizer",
    category: "Create",
    description: "Purge hidden metadata, tracking IDs, and redact sensitive PII layers permanently.",
    href: "/tools/document-sanitizer",
    badge: "Zero Leak",
    icon: "🛡️",
  },
  {
    id: "ocr-extractor",
    name: "WASM OCR Engine",
    category: "Understand",
    description: "Extract text from scanned PDFs and photos directly in browser with Tesseract WASM.",
    href: "/tools/ocr-extractor",
    badge: "Offline",
    icon: "👁️",
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown to PDF",
    category: "Convert",
    description: "Render GitHub Markdown and styled HTML into vector PDFs with word-wrapping.",
    href: "/tools/markdown-to-pdf",
    badge: "Vector AST",
    icon: "📝",
  },
  {
    id: "pdf-assembler",
    name: "PDF Assembler",
    category: "Create",
    description: "Merge, split, reorder, and rotate PDF pages interactively with real-time thumbnail grid.",
    href: "/tools/pdf-assembler",
    badge: "Client-Side",
    icon: "📑",
  },
  {
    id: "format-converter",
    name: "Format Converter",
    category: "Convert",
    description: "Transcode images between PNG, JPG, and WEBP, and render PDF pages as image assets.",
    href: "/tools/format-converter",
    badge: "Multi-Format",
    icon: "🔄",
  },
  {
    id: "svg-minifier",
    name: "SVG Minifier",
    category: "Compress",
    description: "Strip editor metadata, round decimal coordinates, and minify vector graphics.",
    href: "/tools/svg-minifier",
    badge: "Vector Clean",
    icon: "✨",
  },
  {
    id: "form-generator",
    name: "Invoice Generator",
    category: "Create",
    description: "Generate structured vector invoice PDFs with tax calculation and itemized tables.",
    href: "/tools/form-generator",
    badge: "Instant PDF",
    icon: "🧾",
  },
];

export function DashboardContainer() {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => historyManager.getEntries());
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>(() => workflowManager.getWorkflows());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const unsubHist = historyManager.subscribe((list) => setHistoryEntries(list));
    const unsubWf = workflowManager.subscribe((list) => setWorkflows(list));
    return () => {
      unsubHist();
      unsubWf();
    };
  }, []);

  const stats = useMemo(() => {
    let bytesSaved = 0;
    let successfulOps = 0;
    for (const e of historyEntries) {
      if (e.status === "success") successfulOps++;
      if (e.reductionBytes && e.reductionBytes > 0) bytesSaved += e.reductionBytes;
    }
    return {
      totalOps: historyEntries.length,
      successfulOps,
      bytesSaved,
    };
  }, [historyEntries]);

  const filteredTools = useMemo(() => {
    return DASHBOARD_TOOLS.filter((tool) => {
      if (selectedCategory !== "all" && tool.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="py-8 pb-24">
      <Container size="xl" className="space-y-8">
        {/* Top Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="accent" size="sm" dot>
                Workspace Dashboard
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
                Public Beta • Free Tier
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
              KALVEX Workspace
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Privacy-first document productivity. Convert, compress, create, and understand files with 100% in-browser memory execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/tools">
              <Button variant="outline" size="sm" className="font-mono text-xs cursor-pointer">
                All Tools Directory ➔
              </Button>
            </Link>
            <Link href="/ai-workspace">
              <Button variant="primary" size="sm" className="font-mono text-xs font-bold cursor-pointer shadow-subtle">
                ✨ AI Reasoning Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics & Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle shadow-card flex flex-col justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Files Processed</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-text-primary">
                {stats.totalOps}
              </span>
              <span className="text-[11px] font-mono text-accent">Operations</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle shadow-card flex flex-col justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Storage Reduced</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-accent">
                {stats.bytesSaved > 0 ? formatBytes(stats.bytesSaved) : "0 KB"}
              </span>
              <span className="text-[11px] font-mono text-text-muted">Saved</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle shadow-card flex flex-col justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Execution Privacy</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-text-primary">
                100%
              </span>
              <span className="text-[11px] font-mono text-green-400">Zero Server Disk</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle shadow-card flex flex-col justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Current Plan</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-extrabold font-mono text-text-primary">
                FREE BETA
              </span>
              <Link href="/pricing" className="text-xs font-mono text-accent hover:underline">
                View Plans
              </Link>
            </div>
          </div>
        </div>

        {/* AI Workspace Highlight Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border-accent/40 bg-gradient-to-r from-surface-raised via-surface-base to-accent/10 p-6 sm:p-8 shadow-card">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-mono font-bold">
              <span>✨ Private Document AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary">
              Private AI Reasoning for Arbitrary Documents
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Extract executive summaries, explain complex legal jargon, and ask grounded questions against your PDF and text documents with strict privacy boundaries.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/ai-workspace">
                <Button variant="primary" size="sm" className="font-mono text-xs font-bold cursor-pointer">
                  Launch AI Workspace ➔
                </Button>
              </Link>
              <span className="text-xs font-mono text-text-muted">
                🔒 In-browser context extraction • Zero model training
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tools Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                Quick Tools Directory
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Launch client-side file transformation tools directly.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-lg border border-border-subtle overflow-x-auto">
                {["all", "Convert", "Compress", "Create", "Understand"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-mono rounded capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-surface-base text-accent font-bold shadow-subtle"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="px-3 py-1.5 bg-surface-base border border-border-default rounded-lg text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group p-5 rounded-xl border border-border-default bg-surface-base hover:border-border-accent/60 hover:bg-surface-hover/80 transition-all shadow-card flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{tool.icon}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-raised text-text-muted border border-border-subtle">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-muted group-hover:text-accent">
                  <span>{tool.category}</span>
                  <span>Launch Tool ➔</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-Column Lower Grid: Recent Activity & Saved Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          {/* Column 1: Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Recent Operations</h3>
                <p className="text-xs text-text-muted">Local in-browser activity history</p>
              </div>
              <Link href="/history" className="text-xs font-mono text-accent hover:underline">
                View Full History ({historyEntries.length}) ➔
              </Link>
            </div>

            <div className="rounded-xl border border-border-default bg-surface-base divide-y divide-border-subtle overflow-hidden">
              {historyEntries.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <span className="text-3xl block">📋</span>
                  <p className="text-xs font-mono font-bold text-text-primary">No Operations Logged Yet</p>
                  <p className="text-xs text-text-muted max-w-xs mx-auto">
                    Transform or compress a file using any tool to see your local history entries here.
                  </p>
                </div>
              ) : (
                historyEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-raised/40 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-text-primary truncate max-w-[180px]">
                          {entry.inputFilename}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          entry.status === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-text-muted truncate">
                        {entry.sourceTool} • {entry.outcome}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-text-muted shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Saved Workflows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Automated Pipelines</h3>
                <p className="text-xs text-text-muted">Chained multi-step document pipelines</p>
              </div>
              <Link href="/workflows" className="text-xs font-mono text-accent hover:underline">
                Manage Pipelines ({workflows.length}) ➔
              </Link>
            </div>

            <div className="rounded-xl border border-border-default bg-surface-base divide-y divide-border-subtle overflow-hidden">
              {workflows.slice(0, 4).map((wf) => (
                <div key={wf.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-raised/40 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold font-mono text-text-primary truncate">
                        {wf.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-raised text-accent border border-border-subtle">
                        {wf.steps.length} Steps
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted line-clamp-1">
                      {wf.description}
                    </p>
                  </div>

                  <Link href="/workflows">
                    <Button variant="secondary" size="sm" className="font-mono text-xs cursor-pointer shrink-0">
                      Run ➔
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
