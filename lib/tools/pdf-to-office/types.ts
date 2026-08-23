export type OfficeTargetFormat = "docx" | "xlsx";

export type DocumentClassification = "native" | "scanned" | "mixed";

export interface OfficeConversionSettings {
  targetFormat: OfficeTargetFormat;
  includeTables?: boolean;
  preserveLayout?: boolean;
  enableOcrFallback?: boolean;
}

export interface OfficeConversionProgress {
  stage: string;
  percent: number;
  currentPage?: number;
  totalPages?: number;
}

export interface ExtractedTable {
  title?: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
}

export interface ExtractedPage {
  pageNumber: number;
  source: "native" | "ocr";
  paragraphs: { type: "heading" | "text" | "list_item"; text: string }[];
  tables: ExtractedTable[];
  totalWords: number;
}

export interface ExtractedDocument {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  classification: DocumentClassification;
  ocrPagesCount: number;
  pages: ExtractedPage[];
  allTables: ExtractedTable[];
}

export interface OfficeConversionResult {
  fileName: string;
  outputSize: number;
  outputName: string;
  outputBlob: Blob;
  targetFormat: OfficeTargetFormat;
  durationMs: number;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  classification: DocumentClassification;
  ocrPagesCount: number;
  tablesCount: number;
  tables: ExtractedTable[];
  busDocumentId?: string;
}

export interface OfficeConversionError {
  code: string;
  message: string;
  suggestOcr?: boolean;
}
