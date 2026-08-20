import { HistoryEntry, HistoryMetrics, SafeHistoryMetadata, HistoryStepSummary } from "./types";
import { documentBus } from "@/lib/document-bus";

const HISTORY_STORAGE_KEY = "kalvex_history_v1";
const MAX_HISTORY_ENTRIES = 100;

const ALLOWED_METADATA_KEYS: (keyof SafeHistoryMetadata)[] = [
  "pageCount",
  "wordCount",
  "linesCount",
  "confidence",
  "formatFrom",
  "formatTo",
  "quality",
  "profile",
  "aiProvider",
  "isSimulated",
  "estimatedTokens",
  "workflowName",
  "stepsCount",
  "failedStep",
  "errorCategory",
];

/**
 * Strict privacy sanitizer enforcing zero document text, zero AI payloads,
 * and zero binary blobs in the History layer.
 */
function sanitizeMetadata(raw?: Record<string, unknown>): SafeHistoryMetadata | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const sanitized: SafeHistoryMetadata = {};
  for (const key of ALLOWED_METADATA_KEYS) {
    const val = raw[key];
    if (val !== undefined) {
      if (typeof val === "number" || typeof val === "boolean") {
        (sanitized as Record<string, unknown>)[key] = val;
      } else if (typeof val === "string") {
        // Truncate long strings to prevent accidental text payload smuggling
        (sanitized as Record<string, unknown>)[key] = val.slice(0, 100);
      }
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeStepSummary(steps?: HistoryStepSummary[]): HistoryStepSummary[] | undefined {
  if (!steps || !Array.isArray(steps)) return undefined;

  return steps.map((s) => ({
    stepIndex: typeof s.stepIndex === "number" ? s.stepIndex : 0,
    title: typeof s.title === "string" ? s.title.slice(0, 100) : "Step",
    durationMs: typeof s.durationMs === "number" ? s.durationMs : 0,
    status: s.status === "success" ? "success" : "failed",
    summary: typeof s.summary === "string" ? s.summary.slice(0, 120) : undefined,
  }));
}

function sanitizeEntry(
  raw: Omit<HistoryEntry, "id" | "timestamp"> & { id?: string; timestamp?: number }
): HistoryEntry {
  return {
    id: raw.id || `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: typeof raw.timestamp === "number" ? raw.timestamp : Date.now(),
    sourceTool: typeof raw.sourceTool === "string" ? raw.sourceTool.slice(0, 50) : "unknown",
    operationType: raw.operationType,

    // Input Document Metadata (strictly operational)
    inputFilename: typeof raw.inputFilename === "string" ? raw.inputFilename.slice(0, 150) : "document",
    inputKind: raw.inputKind,
    inputSize: typeof raw.inputSize === "number" ? raw.inputSize : 0,

    // Output Result Metadata (strictly operational)
    outputFilename: typeof raw.outputFilename === "string" ? raw.outputFilename.slice(0, 150) : "result",
    outputKind: raw.outputKind,
    outputSize: typeof raw.outputSize === "number" ? raw.outputSize : undefined,

    // Performance & Outcome
    status: raw.status === "success" ? "success" : "failed",
    outcome: typeof raw.outcome === "string" ? raw.outcome.slice(0, 100) : "Completed",
    savingsPercentage: typeof raw.savingsPercentage === "number" ? raw.savingsPercentage : undefined,
    reductionBytes: typeof raw.reductionBytes === "number" ? raw.reductionBytes : undefined,
    durationMs: typeof raw.durationMs === "number" ? raw.durationMs : undefined,

    // Document Bus RAM pointer
    busArtifactId: typeof raw.busArtifactId === "string" ? raw.busArtifactId.slice(0, 80) : undefined,

    // Sanitized step breakdown
    stepSummary: sanitizeStepSummary(raw.stepSummary),

    // Sanitized metadata allowlist
    metadata: sanitizeMetadata(raw.metadata as Record<string, unknown> | undefined),
  };
}

type HistoryListener = (entries: HistoryEntry[]) => void;

class HistoryManager {
  private entries: HistoryEntry[] = [];
  private listeners: Set<HistoryListener> = new Set();
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.entries = parsed.slice(0, MAX_HISTORY_ENTRIES).map((e) => sanitizeEntry(e));
        }
      }
    } catch {
      // Graceful fallback to in-memory state on storage access error
      this.entries = [];
    }
    this.initialized = true;
  }

  private persistToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      // Ensure all entries are sanitized and strictly capped at MAX_HISTORY_ENTRIES (FIFO eviction)
      const sanitizedList = this.entries.slice(0, MAX_HISTORY_ENTRIES).map((e) => sanitizeEntry(e));
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sanitizedList));
    } catch {
      // Storage unavailable or quota exceeded; maintain in-memory state
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized && typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private notifyListeners(): void {
    const list = this.getEntries();
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch (err) {
        console.error("Error in History listener:", err);
      }
    });
  }

  /**
   * Record an operation into History with strict privacy sanitization.
   */
  public recordEntry(
    entry: Omit<HistoryEntry, "id" | "timestamp"> & { timestamp?: number }
  ): HistoryEntry {
    this.ensureInitialized();

    const sanitized = sanitizeEntry(entry);

    // Prepend to top of activity list
    this.entries.unshift(sanitized);

    // Enforce FIFO limit
    if (this.entries.length > MAX_HISTORY_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_HISTORY_ENTRIES);
    }

    this.persistToStorage();
    this.notifyListeners();
    return sanitized;
  }

  /**
   * Retrieve all recorded history entries in reverse chronological order.
   */
  public getEntries(): HistoryEntry[] {
    this.ensureInitialized();
    return [...this.entries];
  }

  /**
   * Remove a specific history entry by ID.
   */
  public removeEntry(id: string): void {
    this.ensureInitialized();
    this.entries = this.entries.filter((e) => e.id !== id);
    this.persistToStorage();
    this.notifyListeners();
  }

  /**
   * Clear all history entries from memory and local storage.
   */
  public clearHistory(): void {
    this.ensureInitialized();
    this.entries = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch {
        // Storage cleanup exception
      }
    }
    this.notifyListeners();
  }

  /**
   * Compute aggregate performance and activity metrics across history.
   */
  public getMetrics(): HistoryMetrics {
    this.ensureInitialized();
    let totalBytesSaved = 0;
    let totalDurationMs = 0;
    let successfulOperations = 0;
    let failedOperations = 0;
    let activeSessionArtifactsCount = 0;

    for (const e of this.entries) {
      if (e.status === "success") {
        successfulOperations++;
      } else {
        failedOperations++;
      }

      if (e.reductionBytes && e.reductionBytes > 0) {
        totalBytesSaved += e.reductionBytes;
      }

      if (e.durationMs && e.durationMs > 0) {
        totalDurationMs += e.durationMs;
      }

      if (e.busArtifactId && documentBus.getArtifact(e.busArtifactId)) {
        activeSessionArtifactsCount++;
      }
    }

    return {
      totalOperations: this.entries.length,
      successfulOperations,
      failedOperations,
      totalBytesSaved,
      totalDurationMs,
      activeSessionArtifactsCount,
    };
  }

  /**
   * Subscribe to history mutations.
   */
  public subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const historyManager = new HistoryManager();
