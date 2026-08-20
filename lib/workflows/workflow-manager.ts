import { SavedWorkflow } from "./types";
import { BUILTIN_WORKFLOW_TEMPLATES } from "./workflow-templates";

const WORKFLOWS_STORAGE_KEY = "kalvex_saved_workflows_v1";
const MAX_CUSTOM_WORKFLOWS = 50;

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
          this.customWorkflows = parsed.slice(0, MAX_CUSTOM_WORKFLOWS);
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

    const newWf: SavedWorkflow = {
      ...workflow,
      id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isTemplate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.customWorkflows.unshift(newWf);

    if (this.customWorkflows.length > MAX_CUSTOM_WORKFLOWS) {
      this.customWorkflows = this.customWorkflows.slice(0, MAX_CUSTOM_WORKFLOWS);
    }

    this.persistToStorage();
    this.notifyListeners();
    return newWf;
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

    const updated: SavedWorkflow = {
      ...this.customWorkflows[index],
      ...updates,
      updatedAt: Date.now(),
    };

    this.customWorkflows[index] = updated;
    this.persistToStorage();
    this.notifyListeners();
    return updated;
  }

  /**
   * Delete a custom workflow. Built-in templates cannot be deleted.
   */
  public deleteWorkflow(id: string): boolean {
    this.ensureInitialized();
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
   * Duplicate any workflow (template or custom) into a new editable custom workflow.
   */
  public duplicateWorkflow(id: string): SavedWorkflow | undefined {
    const existing = this.getWorkflow(id);
    if (!existing) return undefined;

    return this.saveWorkflow({
      name: `${existing.name} (Copy)`,
      description: existing.description,
      category: "custom",
      acceptedInputKinds: [...existing.acceptedInputKinds],
      outputKind: existing.outputKind,
      steps: existing.steps.map((s, idx) => ({
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
