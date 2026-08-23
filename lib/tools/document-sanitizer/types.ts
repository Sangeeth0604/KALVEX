export interface RedactionRule {
  id: string;
  type: "text_keyword" | "pattern_ssn" | "pattern_email" | "pattern_phone" | "custom_regex";
  target: string;
  replacementLabel?: string;
}

export interface SanitizerSettings {
  stripMetadata: boolean;
  stripHiddenLayers: boolean;
  redactionRules: RedactionRule[];
}

export interface SanitizerResult {
  fileName: string;
  originalSize: number;
  sanitizedSize: number;
  redactedCount: number;
  metadataFieldsStripped: string[];
  outputBlob: Blob;
  outputName: string;
  durationMs: number;
  busDocumentId?: string;
}
