"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { SavedWorkflow, WorkflowRunState } from "@/lib/workflows/types";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { documentBus } from "@/lib/document-bus";
import { executeWorkflow } from "@/lib/workflows/workflow-runner";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/tools/format-converter/format-converter-engine";

interface WorkflowRunnerModalProps {
  workflow: SavedWorkflow;
  onClose: () => void;
}

export function WorkflowRunnerModal({ workflow, onClose }: WorkflowRunnerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [runState, setRunState] = useState<WorkflowRunState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [finalArtifact, setFinalArtifact] = useState<DocumentArtifact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleStartWorkflow = async () => {
    if (!selectedFile) return;

    setIsRunning(true);
    setErrorMessage(null);
    setFinalArtifact(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. Publish initial file to Document Bus
    const initialArtifact = documentBus.publishArtifact({
      name: selectedFile.name,
      mimeType: selectedFile.type || "application/octet-stream",
      sourceTool: "workflow-runner",
      file: selectedFile,
    });

    try {
      const result = await executeWorkflow(
        workflow,
        initialArtifact,
        (state) => {
          setRunState(state);
        },
        controller.signal
      );

      if (result.status === "success" && result.finalArtifact) {
        setFinalArtifact(result.finalArtifact);
      } else if (result.status === "failed") {
        setErrorMessage(result.errorMessage || "Workflow failed during execution.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Workflow execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  };

  const handleDownload = () => {
    if (!finalArtifact) return;
    const url = URL.createObjectURL(finalArtifact.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalArtifact.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getOpenDestinationHref = (): string => {
    if (!finalArtifact) return "/tools";
    if (finalArtifact.kind === "text") {
      return `/ai-workspace?artifact=${finalArtifact.id}`;
    }
    if (finalArtifact.sourceTool && finalArtifact.sourceTool !== "workflow-runner") {
      return `/tools/${finalArtifact.sourceTool}?artifact=${finalArtifact.id}`;
    }
    return `/ai-workspace?artifact=${finalArtifact.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface-base border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
                Workflow Orchestrator
              </span>
              <span className="text-xs font-mono text-text-muted">
                {workflow.steps.length} Steps
              </span>
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              {workflow.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="text-text-muted hover:text-text-primary text-sm font-mono p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Upload Zone (shown before execution) */}
          {!runState && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-border-default hover:border-border-accent rounded-xl text-center space-y-3 bg-surface-raised/30 transition-colors">
                <input
                  type="file"
                  id="wf-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="wf-file-input"
                  className="cursor-pointer block space-y-2"
                >
                  <span className="text-3xl block">📄</span>
                  <div className="text-xs font-mono font-bold text-text-primary">
                    {selectedFile ? selectedFile.name : "Select or Drop Document to Run Pipeline"}
                  </div>
                  <div className="text-[11px] font-mono text-text-muted">
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)} • Ready to process`
                      : `Accepts: ${workflow.acceptedInputKinds.join(", ").toUpperCase()}`}
                  </div>
                </label>
              </div>

              {/* Step Sequence Overview */}
              <div className="p-4 rounded-xl bg-surface-raised/40 border border-border-subtle space-y-2">
                <div className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                  Pipeline Execution Steps:
                </div>
                <div className="space-y-2">
                  {workflow.steps.map((step, idx) => (
                    <div
                      key={step.stepId}
                      className="p-2.5 rounded-lg bg-surface-base border border-border-subtle flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-accent font-bold">#{idx + 1}</span>
                        <span className="text-text-primary font-medium">{step.title}</span>
                      </div>
                      <span className="text-[10px] text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
                        {step.capabilityId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Running State Timeline */}
          {runState && (
            <div className="space-y-4">
              {/* Overall Progress Header */}
              <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-text-primary">
                    Step {runState.currentStepIndex} of {runState.totalSteps}: {runState.currentStepTitle}
                  </span>
                  <span className="text-accent font-bold">
                    {runState.status === "running" ? "⏳ Running..." : runState.status === "success" ? "✓ Completed" : "✗ Failed"}
                  </span>
                </div>

                <div className="w-full bg-surface-base h-2 rounded-full overflow-hidden border border-border-subtle">
                  <div
                    className={`h-full transition-all duration-300 ${
                      runState.status === "failed" ? "bg-error" : "bg-accent"
                    }`}
                    style={{
                      width: `${(runState.currentStepIndex / runState.totalSteps) * 100}%`,
                    }}
                  />
                </div>

                <p className="text-[11px] font-mono text-text-secondary animate-pulse">
                  {runState.stageMessage}
                </p>
              </div>

              {/* Step Logs */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-text-muted font-bold">
                  Step Execution Details:
                </div>
                {runState.stepLogs.map((log) => (
                  <div
                    key={log.stepIndex}
                    className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                      log.status === "success"
                        ? "bg-surface-base border-border-default"
                        : "bg-error/10 border-error/30 text-error"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">
                        Step #{log.stepIndex}: {log.stepTitle}
                      </span>
                      <span className={log.status === "success" ? "text-accent font-bold" : "text-error font-bold"}>
                        {log.status === "success" ? `✓ ${log.durationMs} ms` : "✗ Failed"}
                      </span>
                    </div>
                    {log.summary && (
                      <p className="text-[11px] text-text-secondary">{log.summary}</p>
                    )}
                    {log.errorMessage && (
                      <p className="text-[11px] text-error font-bold">{log.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-xs font-mono text-error space-y-1">
              <div className="font-bold">⚠ Workflow Execution Stopped:</div>
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Final Success Result Card */}
          {finalArtifact && (
            <div className="p-4 rounded-xl bg-accent-subtle/30 border border-border-accent space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-accent text-lg font-bold">✓</span>
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                  Workflow Output Ready
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-base border border-border-subtle text-xs font-mono space-y-1">
                <div className="font-bold text-accent truncate">{finalArtifact.name}</div>
                <div className="text-text-muted text-[11px]">
                  {finalArtifact.kind.toUpperCase()} • {formatBytes(finalArtifact.size)} • Published to Document Bus
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link href={getOpenDestinationHref()} onClick={onClose}>
                  <Button variant="primary" size="sm" className="font-mono text-xs font-bold">
                    Open in Destination ➔
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleDownload} className="font-mono text-xs">
                  Download File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-surface-raised border-t border-border-subtle flex items-center justify-between gap-3 text-xs font-mono">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isRunning}
            className="text-xs font-mono"
          >
            {finalArtifact ? "Done" : "Close"}
          </Button>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs font-mono text-error border-error/50 hover:bg-error/10"
              >
                Cancel Execution
              </Button>
            ) : !finalArtifact ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartWorkflow}
                disabled={!selectedFile}
                className="font-mono text-xs font-bold"
              >
                Start Pipeline ➔
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setRunState(null);
                  setFinalArtifact(null);
                  setSelectedFile(null);
                }}
                className="font-mono text-xs font-bold"
              >
                Run Another Document
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
