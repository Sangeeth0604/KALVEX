import { SavedWorkflow, WorkflowCategory, WorkflowStepDefinition } from "./types";
import { BUILTIN_WORKFLOW_TEMPLATES } from "./workflow-templates";

const WORKFLOWS_STORAGE_KEY = "kalvex_saved_workflows_v1";
const MAX_CUSTOM_WORKFLOWS = 50;
export const MAX_STEPS_PER_WORKFLOW = 10;

/**
 * Strict schema validator defending against corrupted or maliciously altered localStorage entries.
 */
function sanitizeWorkflow(raw: unknown): SavedWorkflow | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== "string" || !obj.id.trim()) return null;
  if (typeof obj.name !== "string" || !obj.name.trim()) return null;
  if (!Array.isArray(obj.steps) || obj.steps.length === 0) return null;

  const validCategories: WorkflowCategory[] = [
    "contracts",
    "optimization",
    "conversion",
    "extraction",
    "custom",
  ];

  const category = validCategories.includes(obj.category as WorkflowCategory)
    ? (obj.category as WorkflowCategory)
    : "custom";

  // Sanitize and cap steps at MAX_STEPS_PER_WORKFLOW
  const sanitizedSteps: WorkflowStepDefinition[] = [];
  const rawSteps = obj.steps.slice(0, MAX_STEPS_PER_WORKFLOW);

  for (let i = 0; i < rawSteps.length; i++) {
    const s = rawSteps[i];
    if (s && typeof s === "object" && typeof s.capabilityId === "string" && typeof s.title === "string") {
      sanitizedSteps.push({
        stepId: typeof s.stepId === "string" ? s.stepId.slice(0, 50) : `step-${i + 1}`,
        capabilityId: s.capabilityId.slice(0, 80),
        title: s.title.slice(0, 100),
        params: s.params && typeof s.params === "object" ? (s.params as Record<string, unknown>) : undefined,
      });
    }
  }

  if (sanitizedSteps.length === 0) return null;

  return {
    id: obj.id.slice(0, 80),
    name: obj.name.slice(0, 120),
    description: typeof obj.description === "string" ? obj.description.slice(0, 300) : "",
    category,
    isTemplate: Boolean(obj.isTemplate),
    acceptedInputKinds: Array.isArray(obj.acceptedInputKinds) ? (obj.acceptedInputKinds as SavedWorkflow["acceptedInputKinds"]) : ["pdf"],
    outputKind: typeof obj.outputKind === "string" ? (obj.outputKind as SavedWorkflow["outputKind"]) : "pdf",
    steps: sanitizedSteps,
    createdAt: typeof obj.createdAt === "number" ? obj.createdAt : Date.now(),
    updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : Date.now(),
  };
}

type WorkflowListener = (workflows: SavedWorkflow[]) => void;

class WorkflowManager {
  private customWorkflows: SavedWorkflow[] = [];
  private listeners: Set<WorkflowListener> = new Set();
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const validated = parsed
            .map((item) => sanitizeWorkflow(item))
            .filter((item): item is SavedWorkflow => item !== null);
          this.customWorkflows = validated.slice(0, MAX_CUSTOM_WORKFLOWS);
        }
      }
    } catch {
      this.customWorkflows = [];
    }
    this.initialized = true;
  }

  private persistToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const capped = this.customWorkflows.slice(0, MAX_CUSTOM_WORKFLOWS);
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(capped));
    } catch {
      // Storage unavailable or quota reached
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized && typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private notifyListeners(): void {
    const list = this.getWorkflows();
    this.listeners.forEach((l) => {
      try {
        l(list);
      } catch (err) {
        console.error("Error in Workflow listener:", err);
      }
    });
  }

  public reload(): void {
    this.loadFromStorage();
    this.notifyListeners();
  }

  /**
   * Return all workflows (Built-in templates + Custom user workflows).
   */
  public getWorkflows(): SavedWorkflow[] {
    this.ensureInitialized();
    return [...BUILTIN_WORKFLOW_TEMPLATES, ...this.customWorkflows];
  }

  /**
   * Find a workflow by ID.
   */
  public getWorkflow(id: string): SavedWorkflow | undefined {
    return this.getWorkflows().find((w) => w.id === id);
  }

  /**
   * Save a new custom workflow definition.
   */
  public saveWorkflow(
    workflow: Omit<SavedWorkflow, "id" | "createdAt" | "updatedAt">
  ): SavedWorkflow {
    this.ensureInitialized();

    const cappedSteps = workflow.steps.slice(0, MAX_STEPS_PER_WORKFLOW);

    const newWf: SavedWorkflow = {
      ...workflow,
      id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      steps: cappedSteps,
      isTemplate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sanitized = sanitizeWorkflow(newWf) || newWf;
    this.customWorkflows.unshift(sanitized);

    if (this.customWorkflows.length > MAX_CUSTOM_WORKFLOWS) {
      this.customWorkflows = this.customWorkflows.slice(0, MAX_CUSTOM_WORKFLOWS);
    }

    this.persistToStorage();
    this.notifyListeners();
    return sanitized;
  }

  /**
   * Update an existing custom workflow.
   */
  public updateWorkflow(
    id: string,
    updates: Partial<Omit<SavedWorkflow, "id" | "createdAt">>
  ): SavedWorkflow | undefined {
    this.ensureInitialized();
    const index = this.customWorkflows.findIndex((w) => w.id === id);
    if (index === -1) return undefined;

    const candidate: SavedWorkflow = {
      ...this.customWorkflows[index],
      ...updates,
      steps: updates.steps ? updates.steps.slice(0, MAX_STEPS_PER_WORKFLOW) : this.customWorkflows[index].steps,
      updatedAt: Date.now(),
    };

    const sanitized = sanitizeWorkflow(candidate) || candidate;
    this.customWorkflows[index] = sanitized;
    this.persistToStorage();
    this.notifyListeners();
    return sanitized;
  }

  /**
   * Delete a custom workflow by ID. Built-in templates are protected.
   */
  public deleteWorkflow(id: string): boolean {
    this.ensureInitialized();
    const isBuiltin = BUILTIN_WORKFLOW_TEMPLATES.some((t) => t.id === id);
    if (isBuiltin) return false;

    const initialLen = this.customWorkflows.length;
    this.customWorkflows = this.customWorkflows.filter((w) => w.id !== id);

    if (this.customWorkflows.length !== initialLen) {
      this.persistToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Duplicate a workflow into a new custom editable copy.
   */
  public duplicateWorkflow(id: string): SavedWorkflow | undefined {
    this.ensureInitialized();
    const source = this.getWorkflow(id);
    if (!source) return undefined;

    return this.saveWorkflow({
      name: `${source.name} (Copy)`,
      description: source.description,
      category: source.category,
      acceptedInputKinds: [...source.acceptedInputKinds],
      outputKind: source.outputKind,
      steps: source.steps.map((s, idx) => ({
        ...s,
        stepId: `step-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    });
  }

  /**
   * Subscribe to workflow collection mutations.
   */
  public subscribe(listener: WorkflowListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const workflowManager = new WorkflowManager();
