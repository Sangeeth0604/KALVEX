export type ArtifactKind = "image" | "pdf" | "text" | "document";

export interface ArtifactMetadata {
  width?: number;
  height?: number;
  pageCount?: number;
  text?: string;
  wordCount?: number;
  linesCount?: number;
  confidence?: number;
  outputFormat?: string;
  originalFileName?: string;
  durationMs?: number;
  savingsPercentage?: number;
  reductionBytes?: number;
  operationType?: string;
  [key: string]: unknown;
}

export interface DocumentArtifact {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  sourceTool: string;
  createdAt: number;
  kind: ArtifactKind;
  file: File | Blob;
  previewUrl?: string;
  metadata?: ArtifactMetadata;
}

// Type alias for backwards compatibility
export type BusDocument = DocumentArtifact;

export type DocumentBusErrorCode =
  | "ARTIFACT_NOT_FOUND"
  | "INVALID_ARTIFACT"
  | "UNSUPPORTED_HANDOFF"
  | "STORAGE_UNAVAILABLE";

export interface DocumentBusError {
  code: DocumentBusErrorCode;
  message: string;
}

export interface CompatibleDestination {
  slug: string;
  name: string;
}

export type BusListener = (artifacts: DocumentArtifact[]) => void;
