export type OptimizationOutcome = "reduced" | "equal" | "larger";

export type OptimizerState =
  | "empty"
  | "analyzing"
  | "ready"
  | "optimizing"
  | "success"
  | "error";

export interface OptimizationSettings {
  stripMetadata: boolean;
  useObjectStreams: boolean;
  pruneOrphanObjects: boolean;
}

export interface PdfDocAnalysis {
  name: string;
  size: number;
  pageCount: number;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  hasMetadataStream: boolean;
  previewUrl?: string | null;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  reductionBytes: number; // originalSize - optimizedSize (can be negative if larger)
  savingsPercentage: number; // (1 - optimizedSize / originalSize) * 100
  outcome: OptimizationOutcome;
  pageCount: number;
  effectiveBlob: Blob;
  effectiveObjectUrl: string;
  effectiveFileName: string;
  candidateBlob: Blob;
  candidateObjectUrl: string;
  candidateFileName: string;
  durationMs: number;
  settings: OptimizationSettings;
  busDocumentId?: string;
}

export type PdfOptimizerErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "CORRUPTED_PDF"
  | "ENCRYPTED_PDF"
  | "OPTIMIZATION_FAILED"
  | "UNKNOWN";

export interface PdfOptimizerError {
  code: PdfOptimizerErrorCode;
  message: string;
}
