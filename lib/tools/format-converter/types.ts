export type InputDocType = "image" | "pdf";

export type ImageOutputFormat = "image/png" | "image/jpeg" | "image/webp";

export type ConverterState =
  | "empty"
  | "analyzing"
  | "ready"
  | "converting"
  | "success"
  | "error";

export interface LoadedSourceInfo {
  file: File | Blob;
  name: string;
  size: number;
  mimeType: string;
  inputType: InputDocType;
  pageCount: number;
  previewUrl: string;
  dimensions?: { width: number; height: number };
}

export interface ConversionSettings {
  targetFormat: ImageOutputFormat;
  quality: number; // 0.1 to 1.0 (for JPG and WEBP)
  pageSelection: "all" | "range";
  pageRangeStart: number;
  pageRangeEnd: number;
}

export interface ConvertedPageResult {
  pageNumber: number;
  fileName: string;
  blob: Blob;
  objectUrl: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
}

export interface ConversionResult {
  originalName: string;
  originalSize: number;
  originalMimeType: string;
  targetMimeType: string;
  targetExtension: string;
  totalOutputSize: number;
  durationMs: number;
  pages: ConvertedPageResult[];
  sizeDifferenceBytes: number; // originalSize - totalOutputSize
  percentageChange: number; // (totalOutputSize - originalSize) / originalSize * 100
  isLarger: boolean;
  busDocumentId?: string;
}

export type ConverterErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "CORRUPTED_FILE"
  | "CONVERSION_FAILED"
  | "INVALID_PAGE_RANGE"
  | "UNKNOWN";

export interface ConverterError {
  code: ConverterErrorCode;
  message: string;
}
