"use client";

import React from "react";
import { SavedWorkflow } from "@/lib/workflows/types";
import { Button } from "@/components/ui/button";

interface WorkflowCardProps {
  workflow: SavedWorkflow;
  onRun: (workflow: SavedWorkflow) => void;
  onDuplicate: (id: string) => void;
  onEdit?: (workflow: SavedWorkflow) => void;
  onDelete?: (id: string) => void;
}

export function WorkflowCard({
  workflow,
  onRun,
  onDuplicate,
  onEdit,
  onDelete,
}: WorkflowCardProps) {
  const getCategoryColor = () => {
    if (workflow.category === "contracts") return "text-accent bg-accent-subtle border-border-accent-subtle";
    if (workflow.category === "optimization") return "text-warning bg-warning/10 border-warning/30";
    if (workflow.category === "conversion") return "text-primary-400 bg-surface-raised border-border-subtle";
    return "text-text-primary bg-surface-raised border-border-default";
  };

  return (
    <div className="p-5 rounded-xl bg-surface-base border border-border-default hover:border-border-accent/40 shadow-card transition-all flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getCategoryColor()}`}>
            {workflow.category}
          </span>
          {workflow.isTemplate ? (
            <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
              System Template
            </span>
          ) : (
            <span className="text-[10px] font-mono text-accent bg-accent-subtle/50 px-2 py-0.5 rounded border border-border-accent font-semibold">
              Custom Workflow
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-text-primary font-sans">
          {workflow.name}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed font-mono">
          {workflow.description}
        </p>
      </div>

      {/* Sequential Step Badges */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <div className="text-[10px] font-mono uppercase text-text-muted font-bold flex items-center justify-between">
          <span>Execution Sequence ({workflow.steps.length} Steps)</span>
          <span className="text-text-primary">
            Accepts: {workflow.acceptedInputKinds.join(", ").toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {workflow.steps.map((step, idx) => (
            <React.Fragment key={step.stepId}>
              <span className="px-2 py-1 rounded bg-surface-raised border border-border-subtle text-[11px] text-text-secondary truncate max-w-[160px]">
                {step.title}
              </span>
              {idx < workflow.steps.length - 1 && (
                <span className="text-accent font-bold text-[10px]">➔</span>
              )}
            </React.Fragment>
          ))}
          <span className="text-accent font-bold text-[10px]">➔</span>
          <span className="px-2 py-1 rounded bg-accent-subtle border border-border-accent text-[11px] font-bold text-accent uppercase">
            {workflow.outputKind} Output
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDuplicate(workflow.id)}
            className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded transition-colors cursor-pointer"
            title="Duplicate as new custom workflow"
          >
            Duplicate
          </button>
          {!workflow.isTemplate && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(workflow)}
              className="text-[11px] text-text-muted hover:text-accent px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Edit
            </button>
          )}
          {!workflow.isTemplate && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(workflow.id)}
              className="text-[11px] text-text-muted hover:text-error px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onRun(workflow)}
          className="font-mono text-xs font-bold"
        >
          Run Workflow ➔
        </Button>
      </div>
    </div>
  );
}
