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
  originalSize: number;
  compressedSize: number;
  reductionBytes: number; // originalSize - compressedSize (can be negative if larger)
  savingsPercentage: number; // (1 - compressedSize / originalSize) * 100
  outcome: CompressionOutcome;
  outputFormat: string;
  outputMimeType: string;
  outputExtension: string;
  width: number;
  height: number;
  blob: Blob; // The generated candidate blob
  objectUrl: string; // The generated blob URL
  effectiveBlob: Blob; // The smaller/optimal blob (original or generated)
  effectiveObjectUrl: string;
  effectiveFileName: string;
  fileName: string;
  durationMs: number;
}

export type CompressionErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "DECODE_FAILED"
  | "ENCODE_FAILED"
  | "UNKNOWN";

export interface CompressionError {
  code: CompressionErrorCode;
  message: string;
}
