"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CategoryKey = "all" | "convert" | "compress" | "create" | "understand";

interface ToolItem {
  id: string;
  name: string;
  category: "convert" | "compress" | "create" | "understand";
  categoryLabel: string;
  description: string;
  inputFormats: string[];
  outputFormat: string;
  executionMode: string;
}

const TOOLS_DATA: ToolItem[] = [
  // Convert
  {
    id: "pdf-to-office",
    name: "PDF to Office Formats",
    category: "convert",
    categoryLabel: "Convert",
    description: "Transform PDF documents into editable Word and Excel structures with layout retention.",
    inputFormats: ["PDF"],
    outputFormat: "DOCX, XLSX",
    executionMode: "In-Memory Engine",
  },
  {
    id: "image-transcoder",
    name: "Image & Vector Transcoder",
    category: "convert",
    categoryLabel: "Convert",
    description: "Convert images to modern formats with color space and alpha channel preservation.",
    inputFormats: ["PNG", "JPG", "SVG"],
    outputFormat: "WEBP, AVIF, PNG",
    executionMode: "Client WASM",
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown & HTML to PDF",
    category: "convert",
    categoryLabel: "Convert",
    description: "Render technical documentation and markdown files into clean, paginated PDF documents.",
    inputFormats: ["MD", "HTML"],
    outputFormat: "PDF",
    executionMode: "Client WASM",
  },

  // Compress
  {
    id: "pdf-optimizer",
    name: "PDF Stream Optimizer",
    category: "compress",
    categoryLabel: "Compress",
    description: "Reduce document size via stream deduplication, font subsetting, and raster downsampling.",
    inputFormats: ["PDF"],
    outputFormat: "Optimized PDF",
    executionMode: "Stream Engine",
  },
  {
    id: "image-compressor",
    name: "Lossless Image Compressor",
    category: "compress",
    categoryLabel: "Compress",
    description: "Strip unnecessary metadata, optimize Huffman tables, and compress images directly in browser.",
    inputFormats: ["PNG", "JPG", "WEBP"],
    outputFormat: "Compressed Image",
    executionMode: "Client WASM",
  },
  {
    id: "media-compressor",
    name: "Batch Media Compressor",
    category: "compress",
    categoryLabel: "Compress",
    description: "Shrink multi-file assets to targeted file size thresholds with configurable bitrate presets.",
    inputFormats: ["Audio", "Media"],
    outputFormat: "Optimized Media",
    executionMode: "In-Memory Worker",
  },

  // Create
  {
    id: "pdf-assembler",
    name: "PDF Assembler & Splitter",
    category: "create",
    categoryLabel: "Create",
    description: "Merge multiple documents, extract specific page ranges, and reorder sheets locally.",
    inputFormats: ["Multiple PDFs"],
    outputFormat: "Merged PDF",
    executionMode: "Client WASM",
  },
  {
    id: "document-sanitizer",
    name: "Document Sanitizer & Redactor",
    category: "create",
    categoryLabel: "Create",
    description: "Permanently scrub sensitive text areas, remove metadata tags, and sanitize document layers.",
    inputFormats: ["PDF", "TXT"],
    outputFormat: "Sanitized PDF",
    executionMode: "Client-Side Engine",
  },
  {
    id: "form-generator",
    name: "Structured Invoice & Form Builder",
    category: "create",
    categoryLabel: "Create",
    description: "Generate structured standard receipts, forms, and invoices from validated data inputs.",
    inputFormats: ["Form Data", "JSON"],
    outputFormat: "Standard PDF",
    executionMode: "Client WASM",
  },

  // Understand
  {
    id: "ocr-extractor",
    name: "Private OCR Text Extractor",
    category: "understand",
    categoryLabel: "Understand",
    description: "Extract text from scanned documents and images using client-side optical character recognition.",
    inputFormats: ["Scanned PDF", "Images"],
    outputFormat: "Plain Text, PDF",
    executionMode: "Client WASM OCR",
  },
  {
    id: "table-parser",
    name: "Tabular Structure Parser",
    category: "understand",
    categoryLabel: "Understand",
    description: "Detect grid structures in document scans and extract tabular figures into spreadsheets.",
    inputFormats: ["PDF", "Images"],
    outputFormat: "CSV, XLSX",
    executionMode: "Table Parser",
  },
  {
    id: "diff-analyzer",
    name: "Document Difference Analyzer",
    category: "understand",
    categoryLabel: "Understand",
    description: "Compare two document revisions side-by-side to highlight textual and structural changes.",
    inputFormats: ["Two Files"],
    outputFormat: "Visual Diff",
    executionMode: "Local Diff Engine",
  },
];

const CATEGORIES: { key: CategoryKey; label: string; count: number }[] = [
  { key: "all", label: "All Tools", count: 12 },
  { key: "convert", label: "Convert", count: 3 },
  { key: "compress", label: "Compress", count: 3 },
  { key: "create", label: "Create", count: 3 },
  { key: "understand", label: "Understand", count: 3 },
];

export function ToolsShowcase() {
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");

  const filteredTools =
    activeTab === "all"
      ? TOOLS_DATA
      : TOOLS_DATA.filter((tool) => tool.category === activeTab);

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-background">
      <Container size="xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <Badge variant="accent" size="md" dot className="mb-4">
              File Engine Suite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-3">
              Engineered for high-volume, precise document operations.
            </h2>
            <p className="text-sm sm:text-base text-text-secondary">
              A representative index of KALVEX tools designed for local-first and zero-retention processing.
            </p>
          </div>

          <Link href="/tools">
            <Button variant="outline" size="md" className="hidden sm:inline-flex">
              Explore Tools Directory →
            </Button>
          </Link>
        </div>

        {/* Category Tabs Workbench */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-border-subtle scrollbar-none">
          {CATEGORIES.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-surface-raised text-accent border border-border-accent shadow-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent"
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

        {/* Directory Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="p-5 rounded-xl bg-surface-base border border-border-default hover:border-border-accent/60 transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
                    {tool.categoryLabel}
                  </span>
                  <span className="text-[11px] font-mono text-text-muted">
                    {tool.executionMode}
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary mb-2">
                  {tool.name}
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border-subtle/80 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-text-muted">In:</span>
                  <span className="text-text-primary truncate font-medium">
                    {tool.inputFormats.join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted">Out:</span>
                  <span className="text-accent font-medium">{tool.outputFormat}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Mobile Action */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/tools" className="w-full block">
            <Button variant="outline" size="md" className="w-full">
              Explore Tools Directory →
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
