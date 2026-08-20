import { ArtifactKind } from "@/lib/document-bus/types";

export type AiOperationType =
  | "summarize"
  | "extract_key_info"
  | "explain_simply"
  | "targeted_qa";

export type ProcessingPrivacyLevel =
  | "LOCAL_ONLY"        // In-browser RAM extraction & context preparation
  | "AI_CLOUD_TRANSIT"  // Transmitting sanitized text context to secure AI proxy
  | "AI_COMPLETED";     // Result received and stored in browser memory

export interface DocumentPageContext {
  pageNumber: number;
  text: string;
  hasOcr: boolean;
  characterCount: number;
}

export interface DocumentContext {
  id: string;
  sourceArtifactId?: string;
  filename: string;
  mimeType: string;
  kind: ArtifactKind;
  pageCount: number;
  extractedText: string;
  pages: DocumentPageContext[];
  totalCharacters: number;
  estimatedTokens: number;
  extractionMethod: "digital_text" | "local_ocr" | "direct_text";
  extractionDurationMs: number;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Structured Result Schemas
// ---------------------------------------------------------------------------

export interface SummaryResult {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
  actionItems: {
    task: string;
    owner?: string;
    priority: "high" | "medium" | "low";
  }[];
  criticalRisksOrAlerts?: string[];
}

export interface ExtractedParty {
  name: string;
  role: string;
  jurisdiction?: string;
}

export interface ExtractedKeyDate {
  label: string;
  date: string;
  isDeadline: boolean;
  pageNumber?: number;
}

export interface ExtractedFinancial {
  description: string;
  amount: string;
  currency: string;
  paymentTerms?: string;
}

export interface ExtractedObligation {
  party: string;
  obligation: string;
  clauseReference?: string;
}

export interface ExtractedDataResult {
  documentType: string;
  parties: ExtractedParty[];
  keyDates: ExtractedKeyDate[];
  financials: ExtractedFinancial[];
  coreObligations: ExtractedObligation[];
  governingLaw?: string;
}

export interface JargonTerm {
  term: string;
  plainEnglishMeaning: string;
  whyItMatters: string;
}

export interface ExplanationResult {
  simplifiedOverview: string;
  coreConcepts: JargonTerm[];
  practicalImplications: string[];
  hiddenCaveats: string[];
}

export interface EvidenceQuote {
  quote: string;
  pageNumber: number;
  context: string;
}

export interface AnswerResult {
  directAnswer: string;
  confidenceScore: "high" | "medium" | "low";
  evidenceQuotes: EvidenceQuote[];
  additionalContext?: string;
}

// ---------------------------------------------------------------------------
// Execution & Operations
// ---------------------------------------------------------------------------

export interface OperationCitation {
  pageNumber: number;
  excerpt: string;
  relevanceExplanation?: string;
}

export interface AiOperationOptions {
  detailLevel?: "brief" | "standard" | "detailed";
  customQuery?: string;
  focusArea?: string;
}

export interface AiOperationMetrics {
  durationMs: number;
  inputTokensEstimated: number;
  outputTokensEstimated: number;
  providerName: string;
  modelName: string;
  isSimulated?: boolean;
}

export type AiErrorCode =
  | "CONTEXT_UNAVAILABLE"
  | "UNSUPPORTED_DOCUMENT"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_REQUEST_FAILED"
  | "AI_QUOTA_EXCEEDED"
  | "AI_RESPONSE_INVALID"
  | "CONTEXT_TOO_LARGE"
  | "PRIVACY_ABORT";

export interface AiOperationError {
  code: AiErrorCode;
  message: string;
  retryable: boolean;
  technicalDetails?: string;
}

export interface AiOperationResult<T = unknown> {
  id: string;
  operation: AiOperationType;
  status: "success" | "error";
  structuredData?: T;
  markdownContent: string;
  citations: OperationCitation[];
  metrics: AiOperationMetrics;
  error?: AiOperationError;
}

export interface AiOperationRequest {
  operation: AiOperationType;
  context: DocumentContext;
  options?: AiOperationOptions;
}

// Backwards compatibility legacy types
export type WorkspaceTab = "summary" | "extraction" | "explanation" | "qa" | "chat" | "clauses";

export interface Citation {
  id: string;
  page: number;
  clause: string;
  excerpt: string;
  sectionId: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  citations?: Citation[];
  jsonPayload?: Record<string, unknown>;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  category: "Obligation" | "Financial" | "Term" | "Compliance";
  citation: string;
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  filename: string;
  pages: number;
  format: string;
  size: string;
  sections: {
    id: string;
    page: number;
    clauseNumber: string;
    title: string;
    content: string;
    isHighlighted?: boolean;
  }[];
}
