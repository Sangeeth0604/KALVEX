export type WorkspaceTab = "chat" | "extraction" | "clauses";

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

export interface DocumentSection {
  id: string;
  page: number;
  clauseNumber: string;
  title: string;
  content: string;
  isHighlighted?: boolean;
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  filename: string;
  pages: number;
  format: string;
  size: string;
  sections: DocumentSection[];
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  category: "Obligation" | "Financial" | "Term" | "Compliance";
  citation: string;
}
