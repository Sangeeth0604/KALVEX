import { SavedWorkflow } from "./types";

export const BUILTIN_WORKFLOW_TEMPLATES: SavedWorkflow[] = [
  {
    id: "wf-template-scanned-contract",
    name: "Scanned Contract Intelligence Pipeline",
    description: "Converts scanned contracts or PDF pages into machine text via WASM OCR, extracts structured legal entities, and produces an executive summary.",
    category: "contracts",
    isTemplate: true,
    acceptedInputKinds: ["pdf", "image"],
    outputKind: "text",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    steps: [
      {
        stepId: "step-1",
        capabilityId: "tool:ocr-extractor",
        title: "1. Local WASM OCR Extraction",
      },
      {
        stepId: "step-2",
        capabilityId: "ai:extract_key_info",
        title: "2. AI Entity & Terms Extraction",
      },
      {
        stepId: "step-3",
        capabilityId: "ai:summarize",
        title: "3. AI Executive Summarization",
        params: { detailLevel: "standard" },
      },
    ],
  },
  {
    id: "wf-template-pdf-optimize-brief",
    name: "Lossless PDF Optimization & Executive Brief",
    description: "Optimizes internal PDF streams and structure without rasterization, then generates an AI executive summary and action items list.",
    category: "optimization",
    isTemplate: true,
    acceptedInputKinds: ["pdf"],
    outputKind: "text",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    steps: [
      {
        stepId: "step-1",
        capabilityId: "tool:pdf-optimizer",
        title: "1. PDF Lossless Stream Optimization",
      },
      {
        stepId: "step-2",
        capabilityId: "ai:summarize",
        title: "2. AI Executive Summary & Action Items",
        params: { detailLevel: "standard" },
      },
    ],
  },
  {
    id: "wf-template-image-web-optimizer",
    name: "High-Efficiency Web Image Optimization",
    description: "Transcodes images to modern WEBP format and applies lossless compression for fast web loading.",
    category: "conversion",
    isTemplate: true,
    acceptedInputKinds: ["image"],
    outputKind: "image",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    steps: [
      {
        stepId: "step-1",
        capabilityId: "tool:format-converter-image",
        title: "1. Transcode to WEBP",
        params: { targetFormat: "WEBP" },
      },
      {
        stepId: "step-2",
        capabilityId: "tool:image-compressor",
        title: "2. Lossless Image Compression",
        params: { quality: 85 },
      },
    ],
  },
  {
    id: "wf-template-jargon-demystifier",
    name: "Scanned Document to Plain English Breakdown",
    description: "Runs OCR on dense agreements or technical forms, then translates jargon into clear plain English with practical caveats.",
    category: "contracts",
    isTemplate: true,
    acceptedInputKinds: ["pdf", "image"],
    outputKind: "text",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    steps: [
      {
        stepId: "step-1",
        capabilityId: "tool:ocr-extractor",
        title: "1. Local WASM OCR Extraction",
      },
      {
        stepId: "step-2",
        capabilityId: "ai:explain_simply",
        title: "2. AI Plain-English Breakdown & Jargon Explainer",
      },
    ],
  },
];
