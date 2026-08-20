import {
  SavedWorkflow,
  WorkflowRunResult,
  WorkflowRunState,
  WorkflowStepRunLog,
} from "./types";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { documentBus } from "@/lib/document-bus";
import { capabilityRegistry } from "./capability-registry";
import { historyManager } from "@/lib/history";

/**
 * Sequential Workflow Orchestrator.
 * Contains zero tool-specific processing algorithms; delegates exclusively to registered capabilities.
 */
export async function executeWorkflow(
  workflow: SavedWorkflow,
  inputArtifact: DocumentArtifact,
  onProgress?: (state: WorkflowRunState) => void,
  signal?: AbortSignal
): Promise<WorkflowRunResult> {
  const startTime = performance.now();
  const stepLogs: WorkflowStepRunLog[] = [];
  let currentArtifact: DocumentArtifact = inputArtifact;

  // 1. Validate Initial Input Compatibility
  if (
    workflow.acceptedInputKinds.length > 0 &&
    !workflow.acceptedInputKinds.includes(inputArtifact.kind) &&
    !workflow.acceptedInputKinds.includes("any" as unknown as typeof inputArtifact.kind)
  ) {
    const errorMsg = `Input artifact format (${inputArtifact.kind.toUpperCase()}) is not accepted by workflow "${workflow.name}". Accepted formats: ${workflow.acceptedInputKinds.join(", ").toUpperCase()}`;
    const failedResult: WorkflowRunResult = {
      workflowId: workflow.id,
      status: "failed",
      durationMs: 1,
      stepLogs: [],
      errorMessage: errorMsg,
      failedStepIndex: 0,
    };

    historyManager.recordEntry({
      sourceTool: "workflow-runner",
      operationType: "workflow_run",
      inputFilename: inputArtifact.name,
      inputKind: inputArtifact.kind,
      inputSize: inputArtifact.size,
      outputFilename: inputArtifact.name,
      outputKind: inputArtifact.kind,
      status: "failed",
      outcome: `Workflow Incompatible (${inputArtifact.kind.toUpperCase()})`,
      durationMs: 1,
      metadata: {
        workflowName: workflow.name,
        errorCategory: "INPUT_INCOMPATIBLE",
      },
    });

    return failedResult;
  }

  // 2. Sequential Step Execution
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepStartTime = performance.now();

    // Check cancellation
    if (signal?.aborted) {
      const abortResult: WorkflowRunResult = {
        workflowId: workflow.id,
        status: "cancelled",
        durationMs: Math.round(performance.now() - startTime),
        finalArtifact: currentArtifact,
        stepLogs,
        errorMessage: "Workflow execution cancelled by user.",
      };
      return abortResult;
    }

    const statePayload: WorkflowRunState = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      currentStepIndex: i + 1,
      totalSteps: workflow.steps.length,
      currentStepTitle: step.title,
      stageMessage: `Executing ${step.title}...`,
      status: "running",
      stepLogs,
    };
    onProgress?.(statePayload);

    // Resolve capability handler
    const handler = capabilityRegistry.get(step.capabilityId);
    if (!handler) {
      const errorMsg = `Unrecognized workflow capability: ${step.capabilityId}`;
      stepLogs.push({
        stepIndex: i + 1,
        stepTitle: step.title,
        capabilityId: step.capabilityId,
        durationMs: Math.round(performance.now() - stepStartTime),
        status: "failed",
        errorMessage: errorMsg,
      });

      const failedResult: WorkflowRunResult = {
        workflowId: workflow.id,
        status: "failed",
        durationMs: Math.round(performance.now() - startTime),
        finalArtifact: currentArtifact,
        stepLogs,
        errorMessage: errorMsg,
        failedStepIndex: i + 1,
      };

      // Record failed run in History
      historyManager.recordEntry({
        sourceTool: "workflow-runner",
        operationType: "workflow_run",
        inputFilename: inputArtifact.name,
        inputKind: inputArtifact.kind,
        inputSize: inputArtifact.size,
        outputFilename: currentArtifact.name,
        outputKind: currentArtifact.kind,
        outputSize: currentArtifact.size,
        status: "failed",
        outcome: `Failed at Step ${i + 1} (${step.title})`,
        durationMs: Math.round(performance.now() - startTime),
        busArtifactId: currentArtifact.id,
        stepSummary: stepLogs.map((s) => ({
          stepIndex: s.stepIndex,
          title: s.stepTitle,
          durationMs: s.durationMs,
          status: s.status === "success" ? "success" : "failed",
          summary: s.status === "failed" ? "Workflow step failed" : s.summary,
        })),
        metadata: {
          workflowName: workflow.name,
          failedStep: step.title,
          errorCategory: "UNKNOWN_CAPABILITY",
        },
      });

      return failedResult;
    }

    // Execute step capability
    try {
      const result = await handler.execute(
        currentArtifact,
        step.params,
        (progress) => {
          onProgress?.({
            ...statePayload,
            stageMessage: progress.stage,
          });
        }
      );

      // Publish intermediate artifact to Document Bus
      const published = documentBus.publishArtifact({
        name: result.name,
        mimeType: result.mimeType,
        sourceTool: handler.sourceTool,
        kind: result.kind,
        file: result.file,
        metadata: {
          ...result.metadata,
          workflowId: workflow.id,
          workflowStep: i + 1,
        },
      });

      const stepDuration = Math.max(1, Math.round(performance.now() - stepStartTime));
      currentArtifact = published;

      stepLogs.push({
        stepIndex: i + 1,
        stepTitle: step.title,
        capabilityId: step.capabilityId,
        durationMs: stepDuration,
        status: "success",
        outputArtifactId: published.id,
        summary: `Produced ${published.name} (${Math.ceil(published.size / 1024)} KB)`,
      });
    } catch (stepErr: unknown) {
      const errorMsg = stepErr instanceof Error ? stepErr.message : "Step execution failed.";
      const stepDuration = Math.max(1, Math.round(performance.now() - stepStartTime));

      stepLogs.push({
        stepIndex: i + 1,
        stepTitle: step.title,
        capabilityId: step.capabilityId,
        durationMs: stepDuration,
        status: "failed",
        errorMessage: errorMsg,
      });

      const failedResult: WorkflowRunResult = {
        workflowId: workflow.id,
        status: "failed",
        durationMs: Math.round(performance.now() - startTime),
        finalArtifact: currentArtifact,
        stepLogs,
        errorMessage: `Step ${i + 1} (${step.title}) failed: ${errorMsg}`,
        failedStepIndex: i + 1,
      };

      onProgress?.({
        ...statePayload,
        status: "failed",
        errorMessage: failedResult.errorMessage,
        stepLogs,
      });

      // Record failed run in History with safe operational metadata
      historyManager.recordEntry({
        sourceTool: "workflow-runner",
        operationType: "workflow_run",
        inputFilename: inputArtifact.name,
        inputKind: inputArtifact.kind,
        inputSize: inputArtifact.size,
        outputFilename: currentArtifact.name,
        outputKind: currentArtifact.kind,
        outputSize: currentArtifact.size,
        status: "failed",
        outcome: `Failed at Step ${i + 1} (${step.title})`,
        durationMs: Math.round(performance.now() - startTime),
        busArtifactId: currentArtifact.id,
        stepSummary: stepLogs.map((s) => ({
          stepIndex: s.stepIndex,
          title: s.stepTitle,
          durationMs: s.durationMs,
          status: s.status === "success" ? "success" : "failed",
          summary: s.status === "failed" ? "Workflow step failed" : s.summary,
        })),
        metadata: {
          workflowName: workflow.name,
          failedStep: step.title,
          errorCategory: "STEP_EXECUTION_FAILED",
        },
      });

      return failedResult;
    }
  }

  // 3. Workflow Success
  const totalDuration = Math.max(1, Math.round(performance.now() - startTime));
  const finalResult: WorkflowRunResult = {
    workflowId: workflow.id,
    status: "success",
    durationMs: totalDuration,
    finalArtifact: currentArtifact,
    stepLogs,
  };

  onProgress?.({
    workflowId: workflow.id,
    workflowName: workflow.name,
    currentStepIndex: workflow.steps.length,
    totalSteps: workflow.steps.length,
    currentStepTitle: "Completed",
    stageMessage: "Workflow executed successfully.",
    status: "success",
    stepLogs,
    finalArtifactId: currentArtifact.id,
  });

  // Consolidated History Entry
  const sizeDiff = inputArtifact.size - currentArtifact.size;
  const savingsPct =
    inputArtifact.size > 0 && sizeDiff > 0
      ? Number(((sizeDiff / inputArtifact.size) * 100).toFixed(1))
      : undefined;

  historyManager.recordEntry({
    sourceTool: "workflow-runner",
    operationType: "workflow_run",
    inputFilename: inputArtifact.name,
    inputKind: inputArtifact.kind,
    inputSize: inputArtifact.size,
    outputFilename: currentArtifact.name,
    outputKind: currentArtifact.kind,
    outputSize: currentArtifact.size,
    status: "success",
    outcome: `Workflow Completed (${workflow.steps.length} Steps)`,
    savingsPercentage: savingsPct,
    reductionBytes: sizeDiff > 0 ? sizeDiff : undefined,
    durationMs: totalDuration,
    busArtifactId: currentArtifact.id,
    stepSummary: stepLogs.map((s) => ({
      stepIndex: s.stepIndex,
      title: s.stepTitle,
      durationMs: s.durationMs,
      status: s.status === "success" ? "success" : "failed",
      summary: s.summary,
    })),
    metadata: {
      workflowName: workflow.name,
      stepsCount: workflow.steps.length,
    },
  });

  return finalResult;
}
