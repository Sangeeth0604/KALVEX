"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowCard } from "./workflow-card";
import { WorkflowRunnerModal } from "./workflow-runner-modal";
import { WorkflowBuilderModal } from "./workflow-builder-modal";
import { SavedWorkflow, WorkflowCategory } from "@/lib/workflows/types";
import { workflowManager } from "@/lib/workflows/workflow-manager";

export function WorkflowsContainer() {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>(() => workflowManager.getWorkflows());
  const [activeCategory, setActiveCategory] = useState<WorkflowCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [activeRunningWorkflow, setActiveRunningWorkflow] = useState<SavedWorkflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<SavedWorkflow | null>(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  useEffect(() => {
    const unsubscribe = workflowManager.subscribe((updatedList) => {
      setWorkflows(updatedList);
    });
    return () => unsubscribe();
  }, []);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      if (activeCategory !== "all" && w.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.steps.some((s) => s.title.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [workflows, activeCategory, searchQuery]);

  const handleDuplicate = (id: string) => {
    workflowManager.duplicateWorkflow(id);
  };

  const handleDelete = (id: string) => {
    workflowManager.deleteWorkflow(id);
  };

  return (
    <div className="py-8 pb-20">
      <Container size="xl" className="space-y-6">
        {/* Header Titlebar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="accent" size="sm" dot>
                Automated Pipelines
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                🔒 Declarative Sequences • Local Orchestration
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
              Saved Workflows
            </h1>
            <p className="text-xs text-text-muted mt-1 font-mono">
              Reusable multi-step document pipelines chaining compression, OCR, transcode, and AI analysis.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreatingWorkflow(true)}
            className="font-mono text-xs font-bold shrink-0 shadow-subtle"
          >
            + Create Custom Workflow
          </Button>
        </div>

        {/* Search & Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-surface-raised rounded-lg border border-border-subtle">
            {(
              [
                { key: "all", label: "All Pipelines" },
                { key: "contracts", label: "Contract Intelligence" },
                { key: "optimization", label: "Optimization" },
                { key: "conversion", label: "Conversion" },
                { key: "custom", label: "Custom Saved" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1 text-xs font-mono rounded capitalize transition-colors cursor-pointer ${
                  activeCategory === cat.key
                    ? "bg-surface-base text-accent font-bold shadow-subtle"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows by step or name..."
              className="w-full px-3 py-1.5 bg-surface-base border border-border-default rounded-lg text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onRun={(wf) => setActiveRunningWorkflow(wf)}
              onDuplicate={handleDuplicate}
              onEdit={(wf) => setEditingWorkflow(wf)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Modals */}
        {activeRunningWorkflow && (
          <WorkflowRunnerModal
            workflow={activeRunningWorkflow}
            onClose={() => setActiveRunningWorkflow(null)}
          />
        )}

        {(isCreatingWorkflow || editingWorkflow) && (
          <WorkflowBuilderModal
            initialWorkflow={editingWorkflow}
            onClose={() => {
              setIsCreatingWorkflow(false);
              setEditingWorkflow(null);
            }}
            onSaved={() => {
              setIsCreatingWorkflow(false);
              setEditingWorkflow(null);
            }}
          />
        )}
      </Container>
    </div>
  );
}
