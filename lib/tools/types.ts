export type ToolCategory = "convert" | "compress" | "create" | "understand";

export type ExecutionModel =
  | "client-wasm"
  | "in-memory-worker"
  | "client-canvas"
  | "local-engine";

export type ToolStatus = "coming-soon" | "preview" | "available";

export type FormatGroup = "all" | "pdf" | "office" | "images" | "text-data";

export interface ToolItem {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  tagline: string;
  description: string;
  inputFormats: string[];
  outputFormat: string;
  executionModel: ExecutionModel;
  executionLabel: string;
  status: ToolStatus;
  statusLabel: string;
  tags: string[];
}

export interface CategoryInfo {
  key: "all" | ToolCategory;
  label: string;
  count: number;
}

export interface FormatFilterInfo {
  key: FormatGroup;
  label: string;
  formats: string[];
}
