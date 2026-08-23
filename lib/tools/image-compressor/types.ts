export type SupportedImageFormat = "image/png" | "image/jpeg" | "image/webp";

export type OutputFormatOption = "original" | "image/jpeg" | "image/webp" | "image/png";

export type QualityPreset = "low" | "balanced" | "high" | "custom";

export type CompressionState = "idle" | "file-selected" | "compressing" | "success" | "error";

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  aspectRatio: string;
  objectUrl: string;
}

export interface CompressionSettings {
  outputFormat: OutputFormatOption;
  quality: number; // 0.1 to 1.0
  qualityPreset: QualityPreset;
}

export type CompressionOutcome = "reduced" | "equal" | "larger";

export interface CompressionResult {
  // Authoritative Output State
  outputBlob: Blob;
  outputObjectUrl: string;
  outputFilename: string;
  outputFormat: string; // "JPEG" | "PNG" | "WEBP"
  outputMimeType: string; // "image/jpeg" | "image/png" | "image/webp"
  outputExtension: string; // "jpg" | "png" | "webp"
  originalSize: number;
  outputSize: number;
  reductionBytes: number;
  savingsPercentage: number;
  wasCompressed: boolean;
  retainedOriginal: boolean;
  reason?: string;
  width: number;
  height: number;
  durationMs: number;
  busDocumentId?: string;

  // Diagnostic Candidate Info (if re-encoding was attempted)
  candidateSize?: number;
  candidateMimeType?: string;
  candidateFormat?: string;

  // Backward compatibility aliases
  blob: Blob;
  objectUrl: string;
  effectiveBlob: Blob;
  effectiveObjectUrl: string;
  effectiveFileName: string;
  fileName: string;
  outcome: CompressionOutcome;
  compressedSize: number;
}

export type CompressionErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "DECODE_FAILED"
  | "ENCODE_FAILED"
  | "VALIDATION_FAILED"
  | "UNKNOWN";

export interface CompressionError {
  code: CompressionErrorCode;
  message: string;
}
