"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { WorkspaceHeader } from "./workspace-header";
import { DocumentViewer } from "./document-viewer";
import { OperationConsole } from "./operation-console";
import { SAMPLE_DOCUMENT } from "@/lib/ai-workspace/mock-data";
import {
  AiOperationOptions,
  AiOperationResult,
  AiOperationType,
  DocumentContext,
  ProcessingPrivacyLevel,
} from "@/lib/ai-workspace/types";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { documentBus } from "@/lib/document-bus";
import { buildDocumentContext } from "@/lib/ai-workspace/context-builder";
import { executeAiOperation } from "@/lib/ai-workspace/ai-client";

function AiWorkspaceInner() {
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [artifact, setArtifact] = useState<DocumentArtifact | null>(null);
  const [context, setContext] = useState<DocumentContext | null>(null);
  const [notFoundId, setNotFoundId] = useState<string | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<ProcessingPrivacyLevel>("LOCAL_ONLY");

  const [activeOperation, setActiveOperation] = useState<AiOperationType>("summarize");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [currentResult, setCurrentResult] = useState<AiOperationResult | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Load Artifact from Document Bus and Build Local Context
  useEffect(() => {
    if (!artifactParam) return;

    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        setArtifact(art);
        setNotFoundId(null);
        setPrivacyLevel("LOCAL_ONLY");
        setErrorMessage(null);

        // Build 100% In-Browser Context
        buildDocumentContext(
          art.file,
          art.name,
          art.mimeType,
          art.id,
          art.metadata?.text as string | undefined
        )
          .then((builtContext) => {
            setContext(builtContext);
            setSelectedSectionId("block-1");
          })
          .catch((err) => {
            console.error("Context preparation failed:", err);
            setErrorMessage(err instanceof Error ? err.message : "Failed to extract local text context.");
          });
      } else {
        setNotFoundId(artifactParam);
        setArtifact(null);
        setContext(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [artifactParam]);

  // 2. Execute Selected AI Operation
  const handleExecuteOperation = useCallback(
    async (op: AiOperationType, options?: AiOperationOptions) => {
      if (!context) return;

      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingStage("Formatting Local Context...");
      setPrivacyLevel("AI_CLOUD_TRANSIT");

      try {
        setProcessingStage("Executing Intelligence Operation via AI Proxy...");
        const result = await executeAiOperation({
          operation: op,
          context,
          options,
        });

        setProcessingStage("Validating Structured Schema & Citations...");
        setCurrentResult(result);
        setPrivacyLevel("AI_COMPLETED");
      } catch (err: unknown) {
        console.error("AI operation failed:", err);
        setErrorMessage(
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "AI operation failed."
        );
        setPrivacyLevel("LOCAL_ONLY");
      } finally {
        setIsProcessing(false);
        setProcessingStage("");
      }
    },
    [context]
  );

  // 3. Direct File Upload Ingestion
  const handleDirectUpload = async (file: File) => {
    try {
      setErrorMessage(null);
      setPrivacyLevel("LOCAL_ONLY");

      // Infer artifact kind
      let kind: "pdf" | "image" | "text" = "text";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        kind = "pdf";
      } else if (file.type.startsWith("image/")) {
        kind = "image";
      }

      const published = documentBus.publishArtifact({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sourceTool: "direct-upload",
        kind,
        file,
      });

      setArtifact(published);
      setNotFoundId(null);

      const builtContext = await buildDocumentContext(
        published.file,
        published.name,
        published.mimeType,
        published.id
      );

      setContext(builtContext);
      setSelectedSectionId("block-1");
    } catch (err) {
      console.error("Direct upload context preparation failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to extract document context.");
    }
  };

  // 4. Clear Session & Clean Up Memory
  const handleClearSession = () => {
    if (artifact) {
      documentBus.removeArtifact(artifact.id);
    }
    setArtifact(null);
    setContext(null);
    setNotFoundId(null);
    setCurrentResult(null);
    setSelectedSectionId(null);
    setPrivacyLevel("LOCAL_ONLY");
    setErrorMessage(null);
  };

  const handleOpenDocument = () => {
    setSelectedSectionId("block-1");
  };

  const handleSelectCitation = (_page: number, excerpt: string) => {
    if (!context) return;
    const lower = excerpt.toLowerCase();
    const idx = context.extractedText
      .split(/\n\n+/)
      .findIndex((p) => p.toLowerCase().includes(lower));
    if (idx >= 0) {
      setSelectedSectionId(`block-${idx + 1}`);
    }
  };

  return (
    <div className="py-8 pb-20">
      <Container size="xl">
        {/* Top Header Bar with Live Privacy Badges & Status */}
        <WorkspaceHeader
          privacyLevel={privacyLevel}
          artifact={artifact}
          context={context}
          notFoundId={notFoundId}
          onClearSession={handleClearSession}
          onOpenDocument={handleOpenDocument}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-xs font-mono text-error flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠ Error:</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-text-muted hover:text-text-primary text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two-Panel Layout: Context Inspector (Left) & Operation Console (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 h-[680px]">
            <DocumentViewer
              document={SAMPLE_DOCUMENT}
              artifact={artifact}
              context={context}
              selectedSectionId={selectedSectionId}
              onSelectSection={setSelectedSectionId}
              onUploadFile={handleDirectUpload}
            />
          </div>

          <div className="lg:col-span-7 h-[680px]">
            <OperationConsole
              context={context}
              activeOperation={activeOperation}
              onSelectOperation={setActiveOperation}
              onExecuteOperation={handleExecuteOperation}
              isProcessing={isProcessing}
              processingStage={processingStage}
              currentResult={currentResult}
              onSelectCitation={handleSelectCitation}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

export function AiWorkspaceContainer() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-text-muted">
          Loading AI Workspace...
        </div>
      }
    >
      <AiWorkspaceInner />
    </Suspense>
  );
}
