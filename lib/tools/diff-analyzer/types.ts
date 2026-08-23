export type DiffChangeType = "added" | "removed" | "unchanged";

export interface DiffLine {
  type: DiffChangeType;
  text: string;
  lineNumA?: number;
  lineNumB?: number;
}

export interface DiffSummary {
  fileAName: string;
  fileBName: string;
  fileASize: number;
  fileBSize: number;
  additionsCount: number;
  deletionsCount: number;
  unchangedCount: number;
  totalLines: number;
  similarityScore: number; // 0 to 1
  durationMs: number;
  diffLines: DiffLine[];
  busDocumentId?: string;
}

export interface DiffError {
  code: "FILE_MISSING" | "FILE_TOO_LARGE" | "EXTRACTION_FAILED" | "DIFF_FAILED";
  message: string;
}
