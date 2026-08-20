export interface PdfDocumentItem {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  arrayBuffer: ArrayBuffer;
  colorTag: string;
}

export interface PdfPageItem {
  id: string;
  docId: string;
  docName: string;
  colorTag: string;
  originalPageIndex: number; // 0-indexed in source document
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string | null;
  aspectRatio: number; // width / height
  isSelected: boolean;
}

export type WorkspaceState = "empty" | "loading" | "ready" | "processing" | "success" | "error";

export interface PdfExportResult {
  pageCount: number;
  fileSize: number;
  fileName: string;
  blob: Blob;
  objectUrl: string;
  durationMs: number;
  operationType: "assemble" | "extract";
  busDocumentId?: string;
}

export type PdfErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "CORRUPTED_PDF"
  | "EMPTY_WORKSPACE"
  | "EXPORT_FAILED"
  | "RENDER_FAILED"
  | "UNKNOWN";

export interface PdfError {
  code: PdfErrorCode;
  message: string;
}
