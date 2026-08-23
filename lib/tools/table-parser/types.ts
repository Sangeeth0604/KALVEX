export type TableExportFormat = "csv" | "json" | "markdown" | "tsv" | "xlsx";

export interface ParsedTableData {
  headers: string[];
  rows: string[][];
  title?: string;
  rowCount: number;
  columnCount: number;
  confidenceScore: number;
  detectedDelimiter?: string;
}

export interface TableParserResult {
  fileName: string;
  fileSize: number;
  tables: ParsedTableData[];
  rawText: string;
  durationMs: number;
  busDocumentId?: string;
}

export interface TableParserError {
  code: "EMPTY_FILE" | "FILE_TOO_LARGE" | "UNSUPPORTED_TYPE" | "PARSE_FAILED" | "NO_TABLE_FOUND";
  message: string;
}
