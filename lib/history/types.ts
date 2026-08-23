import { ArtifactKind } from "@/lib/document-bus/types";

export type HistoryOperationType =
  | "convert"
  | "compress"
  | "assemble"
  | "split"
  | "ocr"
  | "optimize"
  | "create"
  | "sanitize"
  | "diff"
  | "table-parse"
  | "ai_operation"
  | "workflow_run";

export type ArtifactAvailability =
  | "ACTIVE_IN_SESSION" // Binary artifact exists in browser RAM (Document Bus)
  | "METADATA_ONLY";    // Browser session refreshed or memory purged

export interface HistoryStepSummary {
  stepIndex: number;
  title: string;
  durationMs: number;
  status: "success" | "failed";
  summary?: string; // Operational summary e.g. "Produced output.pdf (120 KB)"
}

export interface SafeHistoryMetadata {
  pageCount?: number;
  wordCount?: number;
  linesCount?: number;
  confidence?: number;
  formatFrom?: string;
  formatTo?: string;
  quality?: number;
  profile?: string;
  aiProvider?: string;
  isSimulated?: boolean;
  estimatedTokens?: number;
  workflowName?: string;
  stepsCount?: number;
  failedStep?: string;
  errorCategory?: string;
}

export interface HistoryEntry {
  id: string;                         // hist-timestamp-random
  timestamp: number;                  // Date.now()
  sourceTool: string;                 // slug (e.g. "pdf-optimizer", "workflow-runner")
  operationType: HistoryOperationType;

  // Input Document Metadata (Zero binary content, zero document text)
  inputFilename: string;
  inputKind: ArtifactKind;
  inputSize: number;

  // Output Result Metadata (Zero binary content, zero document text)
  outputFilename: string;
  outputKind: ArtifactKind;
  outputSize?: number;

  // Outcome & Performance Metrics
  status: "success" | "failed";
  outcome: string;                    // e.g. "Reduced (-42.5%)", "Extracted 8 Pages", "Converted to WEBP"
  savingsPercentage?: number;
  reductionBytes?: number;
  durationMs?: number;

  // Cross-Tool Document Bus Reference
  busArtifactId?: string;             // Active ID in Document Bus if generated in current session

  // Workflow Step Breakdown
  stepSummary?: HistoryStepSummary[];

  // Strongly typed safe operational metadata only (Zero document text, zero AI payloads)
  metadata?: SafeHistoryMetadata;
}

export interface HistoryMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalBytesSaved: number;
  totalDurationMs: number;
  activeSessionArtifactsCount: number;
}

export type HistoryCategoryFilter =
  | "all"
  | "convert"
  | "compress"
  | "ocr"
  | "ai"
  | "workflow";
