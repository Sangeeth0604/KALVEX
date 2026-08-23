export type MarkdownInputMode = "markdown" | "html";
export type PdfPageSize = "a4" | "letter";

export interface MarkdownPdfSettings {
  mode: MarkdownInputMode;
  pageSize: PdfPageSize;
  title: string;
  author?: string;
  theme?: "clean" | "academic" | "modern";
}

export interface MarkdownPdfResult {
  fileName: string;
  outputSize: number;
  outputName: string;
  outputBlob: Blob;
  pageCount: number;
  durationMs: number;
  busDocumentId?: string;
}
