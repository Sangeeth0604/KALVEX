export interface CapabilityItem {
  id: string;
  name: string;
  category: "Convert" | "Compress" | "Create" | "Understand" | "Workspace";
  description: string;
  href: string;
}

export const CORE_DOCUMENT_TOOLS: CapabilityItem[] = [
  {
    id: "image-compressor",
    name: "Image Compressor",
    category: "Compress",
    description: "Format-preserving lossless compression for JPEG, PNG, and WebP images.",
    href: "/tools/image-compressor",
  },
  {
    id: "pdf-assembler",
    name: "PDF Assembler",
    category: "Create",
    description: "Reorder, split, merge, and rotate PDF pages in-memory.",
    href: "/tools/pdf-assembler",
  },
  {
    id: "pdf-optimizer",
    name: "PDF Optimizer",
    category: "Compress",
    description: "Deduplicate font streams and compress embedded PDF assets.",
    href: "/tools/pdf-optimizer",
  },
  {
    id: "document-sanitizer",
    name: "Document Sanitizer",
    category: "Create",
    description: "Redact PII, strip metadata, and remove sensitive hidden streams.",
    href: "/tools/document-sanitizer",
  },
  {
    id: "diff-analyzer",
    name: "Difference Analyzer",
    category: "Understand",
    description: "Granular text diffs between DOCX and PDF documents with token-level highlights.",
    href: "/tools/diff-analyzer",
  },
  {
    id: "table-parser",
    name: "Table Parser",
    category: "Understand",
    description: "Structure-aware table detection with CSV and Excel XML export.",
    href: "/tools/table-parser",
  },
  {
    id: "format-converter",
    name: "Format Converter",
    category: "Convert",
    description: "Convert PDFs and image formats without uploading files to a server.",
    href: "/tools/format-converter",
  },
  {
    id: "ocr-extractor",
    name: "OCR Extractor",
    category: "Understand",
    description: "Offline WebAssembly OCR extraction for scanned documents and images.",
    href: "/tools/ocr-extractor",
  },
  {
    id: "pdf-to-office",
    name: "PDF to Office",
    category: "Convert",
    description: "Convert PDF documents to Microsoft Word (DOCX) and Excel (XLSX).",
    href: "/tools/pdf-to-office",
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown to PDF",
    category: "Convert",
    description: "Render formatted Markdown and HTML into clean vector PDF documents.",
    href: "/tools/markdown-to-pdf",
  },
  {
    id: "svg-minifier",
    name: "SVG Minifier",
    category: "Compress",
    description: "Minify vector SVGs by stripping metadata and rounding coordinates.",
    href: "/tools/svg-minifier",
  },
  {
    id: "form-generator",
    name: "Invoice Generator",
    category: "Create",
    description: "Generate structured vector invoice PDFs with tax calculation and itemized tables.",
    href: "/tools/form-generator",
  },
];

export const WORKSPACE_CAPABILITIES: CapabilityItem[] = [
  {
    id: "dashboard",
    name: "Workspace Dashboard",
    category: "Workspace",
    description: "Unified productivity command center with usage telemetry and quick launch.",
    href: "/dashboard",
  },
  {
    id: "history",
    name: "Operation History",
    category: "Workspace",
    description: "Local browser activity log with instant download and re-run actions.",
    href: "/history",
  },
  {
    id: "workflows",
    name: "Saved Workflows",
    category: "Workspace",
    description: "Chain multi-tool document automation pipelines with custom presets.",
    href: "/workflows",
  },
  {
    id: "ai-workspace",
    name: "AI Workspace",
    category: "Workspace",
    description: "Private document intelligence console for summarization and targeted Q&A.",
    href: "/ai-workspace",
  },
  {
    id: "settings",
    name: "Privacy & Settings",
    category: "Workspace",
    description: "Control RAM memory cache, theme appearance, and processing defaults.",
    href: "/settings",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const PRICING_FAQS: FaqItem[] = [
  {
    question: "Is KALVEX really free?",
    answer: "Yes. The core KALVEX platform is available free of charge.",
  },
  {
    question: "Do I need a subscription?",
    answer: "No. KALVEX does not require a subscription to use its core tools.",
  },
  {
    question: "How does KALVEX make money?",
    answer: "KALVEX is supported by advertising rather than requiring users to pay for core document tools.",
  },
  {
    question: "Will advertisements affect document processing?",
    answer: "No. Advertisements should remain separate from document upload, processing, results, and downloads.",
  },
  {
    question: "Are my files uploaded to KALVEX?",
    answer: "Core client-side tools process files directly in your browser whenever supported. Refer to the Privacy Policy for the exact processing behavior of each capability.",
  },
];
