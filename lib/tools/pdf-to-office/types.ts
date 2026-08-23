export type OfficeTargetFormat = "docx" | "xlsx";

export interface OfficeConversionSettings {
  targetFormat: OfficeTargetFormat;
  extractTablesOnly?: boolean;
  preservePageBreaks?: boolean;
}

export interface OfficeConversionResult {
  fileName: string;
  originalSize: number;
  outputSize: number;
  outputName: string;
  outputBlob: Blob;
  targetFormat: OfficeTargetFormat;
  pageCount: number;
  wordCount: number;
  tableCount: number;
  durationMs: number;
  busDocumentId?: string;
}

export interface OfficeConversionError {
  code: "INVALID_PDF" | "EMPTY_PDF" | "CONVERSION_FAILED";
  message: string;
}
