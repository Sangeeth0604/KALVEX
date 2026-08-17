import { ToolItem, ToolCategory, CategoryInfo, FormatFilterInfo, FormatGroup } from "./types";

export const TOOLS_DATA: ToolItem[] = [
  // CONVERT (3)
  {
    id: "pdf-to-office",
    slug: "pdf-to-office",
    name: "PDF to Office Formats",
    category: "convert",
    categoryLabel: "Convert",
    tagline: "Convert PDF documents into editable Word and Excel structures.",
    description: "Transform PDF documents into editable Word (DOCX) and Excel (XLSX) structures with layout and table retention.",
    inputFormats: ["PDF"],
    outputFormat: "DOCX, XLSX",
    executionModel: "in-memory-worker",
    executionLabel: "In-Memory Engine",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["pdf", "word", "excel", "office", "docx", "xlsx", "convert"],
  },
  {
    id: "image-transcoder",
    slug: "image-transcoder",
    name: "Image & Vector Transcoder",
    category: "convert",
    categoryLabel: "Convert",
    tagline: "Convert images to modern formats with color space preservation.",
    description: "Convert raster and vector images into modern web formats with color space and alpha channel preservation.",
    inputFormats: ["PNG", "JPG", "SVG"],
    outputFormat: "WEBP, AVIF, PNG",
    executionModel: "client-wasm",
    executionLabel: "Client WASM",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["image", "png", "jpg", "svg", "webp", "avif", "vector", "convert"],
  },
  {
    id: "markdown-to-pdf",
    slug: "markdown-to-pdf",
    name: "Markdown & HTML to PDF",
    category: "convert",
    categoryLabel: "Convert",
    tagline: "Render technical markdown and HTML documents into clean PDFs.",
    description: "Render technical markdown documentation and HTML code into clean, paginated PDF documents.",
    inputFormats: ["MD", "HTML"],
    outputFormat: "PDF",
    executionModel: "client-wasm",
    executionLabel: "Client WASM",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["markdown", "html", "pdf", "docs", "text", "convert"],
  },

  // COMPRESS (3)
  {
    id: "pdf-optimizer",
    slug: "pdf-optimizer",
    name: "PDF Stream Optimizer",
    category: "compress",
    categoryLabel: "Compress",
    tagline: "Reduce document size via stream deduplication and raster downsampling.",
    description: "Reduce PDF file sizes through structural stream optimization, font subsetting, and raster downsampling.",
    inputFormats: ["PDF"],
    outputFormat: "PDF",
    executionModel: "in-memory-worker",
    executionLabel: "Stream Engine",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["pdf", "compress", "optimize", "shrink", "stream"],
  },
  {
    id: "image-compressor",
    slug: "image-compressor",
    name: "Lossless Image Compressor",
    category: "compress",
    categoryLabel: "Compress",
    tagline: "Strip metadata and compress raster images directly in browser.",
    description: "Strip unnecessary metadata, optimize Huffman tables, and compress raster images directly in browser.",
    inputFormats: ["PNG", "JPG", "WEBP"],
    outputFormat: "PNG, JPG, WEBP",
    executionModel: "client-wasm",
    executionLabel: "Client WASM",
    status: "available",
    statusLabel: "Available",
    tags: ["image", "compress", "png", "jpg", "webp", "lossless"],
  },
  {
    id: "svg-minifier",
    slug: "svg-minifier",
    name: "SVG Vector Minifier",
    category: "compress",
    categoryLabel: "Compress",
    tagline: "Clean vector paths, remove editor metadata, and minimize SVG file weight.",
    description: "Clean vector paths, remove editor artifacts, strip metadata, and reduce SVG footprint.",
    inputFormats: ["SVG"],
    outputFormat: "SVG",
    executionModel: "client-wasm",
    executionLabel: "Client WASM",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["svg", "vector", "compress", "minify", "clean"],
  },

  // CREATE (3)
  {
    id: "pdf-assembler",
    slug: "pdf-assembler",
    name: "PDF Assembler & Splitter",
    category: "create",
    categoryLabel: "Create",
    tagline: "Merge multiple documents, extract page ranges, and reorder sheets.",
    description: "Merge multiple PDF documents, extract specific page ranges, rotate pages, and reorder sheets locally.",
    inputFormats: ["PDF"],
    outputFormat: "PDF",
    executionModel: "client-wasm",
    executionLabel: "Client WASM",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["pdf", "merge", "split", "reorder", "assemble", "create"],
  },
  {
    id: "document-sanitizer",
    slug: "document-sanitizer",
    name: "Document Sanitizer & Redactor",
    category: "create",
    categoryLabel: "Create",
    tagline: "Scrub sensitive text areas and remove hidden document metadata.",
    description: "Permanently scrub sensitive text areas, remove metadata tags, and sanitize document layers.",
    inputFormats: ["PDF", "TXT"],
    outputFormat: "PDF, TXT",
    executionModel: "client-canvas",
    executionLabel: "Client-Side Canvas",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["pdf", "redact", "sanitize", "privacy", "text", "create"],
  },
  {
    id: "form-generator",
    slug: "form-generator",
    name: "Structured Invoice & Form Builder",
    category: "create",
    categoryLabel: "Create",
    tagline: "Generate standard forms, receipts, and invoices from validated structured inputs.",
    description: "Generate structured standard receipts, forms, and invoices from validated JSON schemas and form data.",
    inputFormats: ["JSON", "Form Data"],
    outputFormat: "PDF",
    executionModel: "client-wasm",
    executionLabel: "Client WASM",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["form", "invoice", "json", "pdf", "builder", "create"],
  },

  // UNDERSTAND (3)
  {
    id: "ocr-extractor",
    slug: "ocr-extractor",
    name: "Private OCR Text Extractor",
    category: "understand",
    categoryLabel: "Understand",
    tagline: "Extract text from scanned documents using optical character recognition.",
    description: "Extract text from scanned documents and images using client-side optical character recognition.",
    inputFormats: ["PDF", "Images"],
    outputFormat: "TXT, PDF",
    executionModel: "client-wasm",
    executionLabel: "Client WASM OCR",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["ocr", "text", "scan", "extract", "image", "pdf", "understand"],
  },
  {
    id: "table-parser",
    slug: "table-parser",
    name: "Tabular Structure Parser",
    category: "understand",
    categoryLabel: "Understand",
    tagline: "Detect grid structures in document scans and export tables to spreadsheets.",
    description: "Detect grid structures in document scans and extract tabular figures into clean CSV and Excel sheets.",
    inputFormats: ["PDF", "Images"],
    outputFormat: "CSV, XLSX",
    executionModel: "in-memory-worker",
    executionLabel: "Table Parser",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["table", "excel", "csv", "data", "grid", "parser", "understand"],
  },
  {
    id: "diff-analyzer",
    slug: "diff-analyzer",
    name: "Document Difference Analyzer",
    category: "understand",
    categoryLabel: "Understand",
    tagline: "Compare two document revisions side-by-side to highlight textual and structural changes.",
    description: "Compare two document revisions side-by-side to highlight textual and structural changes.",
    inputFormats: ["PDF", "TXT"],
    outputFormat: "Diff Report",
    executionModel: "local-engine",
    executionLabel: "Local Diff Engine",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    tags: ["diff", "compare", "revisions", "changes", "pdf", "text", "understand"],
  },
];

export const FORMAT_FILTERS: FormatFilterInfo[] = [
  {
    key: "all",
    label: "All Formats",
    formats: [],
  },
  {
    key: "pdf",
    label: "PDF",
    formats: ["PDF"],
  },
  {
    key: "office",
    label: "Office",
    formats: ["DOCX", "XLSX"],
  },
  {
    key: "images",
    label: "Images",
    formats: ["PNG", "JPG", "WEBP", "SVG", "Images"],
  },
  {
    key: "text-data",
    label: "Text & Data",
    formats: ["MD", "HTML", "TXT", "CSV", "JSON", "Form Data"],
  },
];

export function getAllTools(): ToolItem[] {
  return TOOLS_DATA;
}

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TOOLS_DATA.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolItem[] {
  return TOOLS_DATA.filter((tool) => tool.category === category);
}

export function getCategoryList(): CategoryInfo[] {
  const counts: Record<string, number> = {
    all: TOOLS_DATA.length,
    convert: 0,
    compress: 0,
    create: 0,
    understand: 0,
  };

  TOOLS_DATA.forEach((tool) => {
    if (counts[tool.category] !== undefined) {
      counts[tool.category]++;
    }
  });

  return [
    { key: "all", label: "All Tools", count: counts.all },
    { key: "convert", label: "Convert", count: counts.convert },
    { key: "compress", label: "Compress", count: counts.compress },
    { key: "create", label: "Create", count: counts.create },
    { key: "understand", label: "Understand", count: counts.understand },
  ];
}

export function filterTools(
  tools: ToolItem[],
  query: string,
  category: "all" | ToolCategory,
  formatGroup: FormatGroup
): ToolItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return tools.filter((tool) => {
    // 1. Category Filter
    if (category !== "all" && tool.category !== category) {
      return false;
    }

    // 2. Format Filter
    if (formatGroup !== "all") {
      const activeFilter = FORMAT_FILTERS.find((f) => f.key === formatGroup);
      if (activeFilter && activeFilter.formats.length > 0) {
        const matchesInput = tool.inputFormats.some((fmt) =>
          activeFilter.formats.includes(fmt)
        );
        const matchesOutput = activeFilter.formats.some((fmt) =>
          tool.outputFormat.includes(fmt)
        );
        if (!matchesInput && !matchesOutput) {
          return false;
        }
      }
    }

    // 3. Search Query Filter
    if (normalizedQuery) {
      const nameMatch = tool.name.toLowerCase().includes(normalizedQuery);
      const descMatch = tool.description.toLowerCase().includes(normalizedQuery);
      const taglineMatch = tool.tagline.toLowerCase().includes(normalizedQuery);
      const tagMatch = tool.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const inputMatch = tool.inputFormats.some((f) => f.toLowerCase().includes(normalizedQuery));
      const outputMatch = tool.outputFormat.toLowerCase().includes(normalizedQuery);
      const engineMatch = tool.executionLabel.toLowerCase().includes(normalizedQuery);

      if (
        !nameMatch &&
        !descMatch &&
        !taglineMatch &&
        !tagMatch &&
        !inputMatch &&
        !outputMatch &&
        !engineMatch
      ) {
        return false;
      }
    }

    return true;
  });
}
