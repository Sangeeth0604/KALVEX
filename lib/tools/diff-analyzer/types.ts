export type DiffChangeType = "added" | "removed" | "unchanged" | "modified";

export interface WordDiffToken {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export interface DiffLine {
  type: DiffChangeType;
  text: string;
  textA?: string;
  textB?: string;
  lineNumA?: number;
  lineNumB?: number;
  wordTokens?: WordDiffToken[];
}

export interface DiffSummary {
  fileAName: string;
  fileBName: string;
  fileASize: number;
  fileBSize: number;
  formatA?: string;
  formatB?: string;
  wordCountA?: number;
  wordCountB?: number;
  additionsCount: number;
  deletionsCount: number;
  unchangedCount: number;
  modifiedCount: number;
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
