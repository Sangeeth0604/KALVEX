import { ArtifactKind, DocumentArtifact } from "@/lib/document-bus/types";

export type WorkflowCategory =
  | "contracts"
  | "optimization"
  | "conversion"
  | "extraction"
  | "custom";

export interface StepProgressCallback {
  (progress: { stage: string; percent?: number }): void;
}

export interface CapabilityExecutionResult {
  file: File | Blob;
  name: string;
  mimeType: string;
  kind: ArtifactKind;
  metadata?: Record<string, unknown>;
}

export interface WorkflowCapabilityHandler {
  capabilityId: string;                   // e.g. "tool:pdf-optimizer", "ai:summarize"
  title: string;                          // e.g. "PDF Stream Optimizer"
  description: string;
  sourceTool: string;                     // slug e.g. "pdf-optimizer"
  acceptedInputKinds: ArtifactKind[];     // e.g. ["pdf"]
  outputKind: ArtifactKind;               // e.g. "pdf"
  execute: (
    inputArtifact: DocumentArtifact,
    params?: Record<string, unknown>,
    onProgress?: StepProgressCallback
  ) => Promise<CapabilityExecutionResult>;
}

export interface WorkflowStepDefinition {
  stepId: string;                         // e.g. "step-1"
  capabilityId: string;                   // Reference to registered WorkflowCapabilityHandler
  title: string;
  params?: Record<string, unknown>;       // e.g. { profile: "profile1_lossless", detailLevel: "standard" }
}

export interface SavedWorkflow {
  id: string;                             // wf-timestamp-random
  name: string;                           // e.g. "Scanned Contract Intelligence Pipeline"
  description: string;
  category: WorkflowCategory;
  isTemplate?: boolean;                   // System static template vs user custom workflow
  acceptedInputKinds: ArtifactKind[];     // e.g. ["pdf", "image"]
  outputKind: ArtifactKind;               // e.g. "text"
  steps: WorkflowStepDefinition[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowStepRunLog {
  stepIndex: number;
  stepTitle: string;
  capabilityId: string;
  durationMs: number;
  status: "success" | "failed" | "skipped";
  errorMessage?: string;
  outputArtifactId?: string;
  summary?: string;
}

export interface WorkflowRunState {
  workflowId: string;
  workflowName: string;
  currentStepIndex: number;
  totalSteps: number;
  currentStepTitle: string;
  stageMessage: string;
  status: "idle" | "running" | "success" | "failed" | "cancelled";
  stepLogs: WorkflowStepRunLog[];
  finalArtifactId?: string;
  errorMessage?: string;
}

export interface WorkflowRunResult {
  workflowId: string;
  status: "success" | "failed" | "cancelled";
  durationMs: number;
  finalArtifact?: DocumentArtifact;
  stepLogs: WorkflowStepRunLog[];
  errorMessage?: string;
  failedStepIndex?: number;
}
