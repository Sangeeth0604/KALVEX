export type TargetUnit = "KB" | "MB";

export type TargetCompressorState =
  | "idle"
  | "analyzing"
  | "compressing"
  | "success"
  | "target-not-reached"
  | "error";

export interface TargetSizeConfig {
  targetBytes: number;
  targetLabel: string;
  unit: TargetUnit;
  value: number;
}

export interface TargetCompressorProgress {
  stage: string;
  currentAttempt: number;
  maxAttempts: number;
  currentSize?: number;
  targetBytes: number;
}

export interface TargetCompressorResult {
  originalFile: File | Blob;
  originalFilename: string;
  originalSize: number;
  originalFormat: string;
  targetBytes: number;
  targetReached: boolean;
  outputBlob: Blob;
  outputSize: number;
  outputFormat: string;
  outputFilename: string;
  formatChanged: boolean;
  formatChangeReason?: string;
  savingsBytes: number;
  savingsPercentage: number;
  compressionRatio: number;
  attempts: number;
  durationMs: number;
  warningNotice?: string;
  previewUrl?: string;
}

export interface TargetCompressorError {
  code: string;
  message: string;
  details?: string;
}
