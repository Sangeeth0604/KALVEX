"use client";

import React, { useState } from "react";
import { SavedWorkflow, WorkflowCategory, WorkflowStepDefinition } from "@/lib/workflows/types";
import { ArtifactKind } from "@/lib/document-bus/types";
import { listWorkflowCapabilities } from "@/lib/workflows/capability-registry";
import { workflowManager } from "@/lib/workflows/workflow-manager";
import { Button } from "@/components/ui/button";

interface WorkflowBuilderModalProps {
  initialWorkflow?: SavedWorkflow | null;
  onClose: () => void;
  onSaved: (workflow: SavedWorkflow) => void;
}

export function WorkflowBuilderModal({
  initialWorkflow,
  onClose,
  onSaved,
}: WorkflowBuilderModalProps) {
  const [name, setName] = useState(initialWorkflow?.name || "");
  const [description, setDescription] = useState(initialWorkflow?.description || "");
  const [category, setCategory] = useState<WorkflowCategory>(
    initialWorkflow?.category || "custom"
  );
  const [steps, setSteps] = useState<WorkflowStepDefinition[]>(
    initialWorkflow?.steps || []
  );
  const [selectedCapabilityId, setSelectedCapabilityId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableCapabilities = listWorkflowCapabilities();

  const handleAddStep = () => {
    if (!selectedCapabilityId) return;
    const cap = availableCapabilities.find((c) => c.capabilityId === selectedCapabilityId);
    if (!cap) return;

    const newStep: WorkflowStepDefinition = {
      stepId: `step-${steps.length + 1}-${cap.capabilityId.replace(/[^a-zA-Z0-9]/g, "_")}`,
      capabilityId: cap.capabilityId,
      title: `${steps.length + 1}. ${cap.title}`,
      params: {},
    };

    setSteps([...steps, newStep]);
    setSelectedCapabilityId("");
    setErrorMessage(null);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, idx) => idx !== index);
    setSteps(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage("Please provide a workflow name.");
      return;
    }

    if (steps.length === 0) {
      setErrorMessage("Workflow must contain at least one operation step.");
      return;
    }

    // Resolve input and output kinds from steps
    const firstCap = availableCapabilities.find((c) => c.capabilityId === steps[0].capabilityId);
    const lastCap = availableCapabilities.find((c) => c.capabilityId === steps[steps.length - 1].capabilityId);

    const acceptedInputKinds: ArtifactKind[] = firstCap ? firstCap.acceptedInputKinds : ["pdf", "image"];
    const outputKind: ArtifactKind = lastCap ? lastCap.outputKind : "text";

    if (initialWorkflow && !initialWorkflow.isTemplate) {
      const updated = workflowManager.updateWorkflow(initialWorkflow.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        acceptedInputKinds,
        outputKind,
        steps,
      });
      if (updated) {
        onSaved(updated);
      }
    } else {
      const created = workflowManager.saveWorkflow({
        name: name.trim(),
        description: description.trim(),
        category,
        acceptedInputKinds,
        outputKind,
        steps,
      });
      onSaved(created);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface-base border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
              Workflow Builder
            </span>
            <h2 className="text-lg font-bold text-text-primary mt-1">
              {initialWorkflow ? `Edit: ${initialWorkflow.name}` : "Create Custom Workflow"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-sm font-mono p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs font-mono">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error font-bold">
              ⚠ {errorMessage}
            </div>
          )}

          {/* Workflow Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-text-muted uppercase text-[10px] font-bold">Workflow Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Scanned Invoice Summarizer"
                className="w-full px-3 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-muted uppercase text-[10px] font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WorkflowCategory)}
                className="w-full px-3 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value="custom">Custom</option>
                <option value="contracts">Contracts</option>
                <option value="optimization">Optimization</option>
                <option value="conversion">Conversion</option>
                <option value="extraction">Extraction</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-text-muted uppercase text-[10px] font-bold">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this automated sequence does..."
              className="w-full px-3 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Step Sequence Manager */}
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-text-primary">
                Sequential Steps ({steps.length})
              </span>
              <span className="text-[10px] text-text-muted">
                Executes sequentially via Document Bus
              </span>
            </div>

            {/* Existing Steps List */}
            {steps.length > 0 ? (
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div
                    key={step.stepId}
                    className="p-3 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-accent font-bold">#{idx + 1}</span>
                      <span className="text-text-primary font-medium">{step.title}</span>
                      <span className="text-[10px] text-text-muted bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle">
                        {step.capabilityId}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="text-text-muted hover:text-error text-xs px-2 py-1 rounded cursor-pointer"
                      title="Remove Step"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-lg bg-surface-raised/40 border border-dashed border-border-default text-text-muted">
                No steps added yet. Choose an operation below to add to the pipeline.
              </div>
            )}

            {/* Add Step Selector */}
            <div className="p-3 rounded-lg bg-surface-raised border border-border-default flex flex-col sm:flex-row sm:items-center gap-2 pt-3">
              <select
                value={selectedCapabilityId}
                onChange={(e) => setSelectedCapabilityId(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-base border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value="">-- Choose Tool or AI Operation --</option>
                {availableCapabilities.map((cap) => (
                  <option key={cap.capabilityId} value={cap.capabilityId}>
                    {cap.title} ({cap.sourceTool})
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddStep}
                disabled={!selectedCapabilityId}
                className="text-xs font-mono shrink-0"
              >
                + Add Step
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-raised border-t border-border-subtle flex items-center justify-between text-xs font-mono">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-mono">
            Cancel
          </Button>

          <Button variant="primary" size="sm" onClick={handleSave} className="text-xs font-mono font-bold">
            Save Workflow ➔
          </Button>
        </div>
      </div>
    </div>
  );
}
