export type OcrInputType = "image" | "pdf";

export type OcrState =
  | "empty"
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "no-text"
  | "error";

export interface OcrProgress {
  currentPage: number;
  totalPages: number;
  stage: string;
  progress: number; // 0 to 100
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number; // 0 to 100
  wordsCount: number;
  linesCount: number;
  previewUrl: string | null;
}

export interface OcrResult {
  fullText: string;
  pages: OcrPageResult[];
  totalPages: number;
  totalWords: number;
  totalLines: number;
  averageConfidence: number;
  durationMs: number;
  fileName: string;
  fileSize: number;
  inputType: OcrInputType;
}

export type OcrErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "OCR_FAILED"
  | "RENDER_FAILED"
  | "CORRUPTED_FILE"
  | "UNKNOWN";

export interface OcrError {
  code: OcrErrorCode;
  message: string;
}

export interface LoadedDocumentInfo {
  file: File;
  name: string;
  size: number;
  type: string;
  inputType: OcrInputType;
  pageCount: number;
  previewUrl: string;
  aspectRatio: number;
}
