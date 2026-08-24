"use client";

import React, { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/ads/ad-slot";
import { UploadZone } from "./upload-zone";
import { TargetControls } from "./target-controls";
import { TargetResult } from "./target-result";
import {
  TargetCompressorProgress,
  TargetCompressorResult,
  TargetCompressorState,
  TargetSizeConfig,
} from "@/lib/tools/target-size-compressor/types";
import {
  compressToTargetSize,
  formatBytes,
} from "@/lib/tools/target-size-compressor/engine";
import { documentBus } from "@/lib/document-bus";
import { historyManager } from "@/lib/history";

function TargetSizeCompressorInner() {
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [state, setState] = useState<TargetCompressorState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(() => {
    if (!artifactParam) return null;
    const artifact = documentBus.getArtifact(artifactParam);
    if (artifact && artifact.file) {
      return artifact.file instanceof File
        ? artifact.file
        : new File([artifact.file], artifact.name, { type: artifact.mimeType });
    }
    return null;
  });
  const [progress, setProgress] = useState<TargetCompressorProgress | null>(null);
  const [result, setResult] = useState<TargetCompressorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setErrorMessage(null);
    setState("idle");
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    setProgress(null);
    setState("idle");
  };

  const handleCompress = useCallback(
    async (config: TargetSizeConfig) => {
      if (!selectedFile) return;

      setState("compressing");
      setErrorMessage(null);
      setProgress({
        stage: "Analyzing file...",
        currentAttempt: 1,
        maxAttempts: 8,
        targetBytes: config.targetBytes,
      });

      try {
        const res = await compressToTargetSize(
          selectedFile,
          selectedFile.name,
          config.targetBytes,
          (p) => setProgress(p)
        );

        setResult(res);
        setState(res.targetReached ? "success" : "target-not-reached");

        // Record in History Manager
        historyManager.recordEntry({
          sourceTool: "target-size-compressor",
          operationType: "compress",
          inputFilename: selectedFile.name,
          inputKind: res.outputFormat === "PDF" ? "pdf" : "image",
          inputSize: selectedFile.size,
          outputFilename: res.outputFilename,
          outputKind: res.outputFormat === "PDF" ? "pdf" : "image",
          outputSize: res.outputSize,
          status: res.targetReached ? "success" : "failed",
          outcome: `Target: ${config.targetLabel} → Output: ${formatBytes(res.outputSize)} (${res.targetReached ? "Reached" : "Best Effort"})`,
          savingsPercentage: res.savingsPercentage,
          reductionBytes: res.savingsBytes,
          durationMs: res.durationMs,
        });

        // Publish to Document Bus
        documentBus.publishArtifact({
          name: res.outputFilename,
          mimeType: res.outputBlob.type || "application/octet-stream",
          file: res.outputBlob,
          sourceTool: "target-size-compressor",
          kind: res.outputFormat === "PDF" ? "pdf" : "image",
          metadata: {
            reductionBytes: res.savingsBytes,
            savingsPercentage: res.savingsPercentage,
            durationMs: res.durationMs,
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred during compression.";
        setErrorMessage(msg);
        setState("error");
      } finally {
        setProgress(null);
      }
    },
    [selectedFile]
  );

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link href="/tools" className="hover:text-accent transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-text-primary">1 MB Compressor</span>
        </div>

        {/* Header & Local Processing Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" dot>
                COMPRESS
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                100% Client-Side
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
              1 MB Compressor
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Reduce supported files to 1 MB or less — directly in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-raised p-3 rounded-lg border border-border-subtle shrink-0">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>In-Memory Browser Execution</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-8 p-4 rounded-xl bg-error-subtle/50 border border-error text-error text-xs font-mono flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm">✕</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs underline cursor-pointer hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Work Area */}
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Step 1: Upload Zone */}
          <UploadZone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClear={handleClearFile}
            disabled={state === "compressing"}
          />

          {/* Step 2: Target Controls (Visible when file is selected and not in result view) */}
          {selectedFile && state !== "success" && state !== "target-not-reached" && (
            <TargetControls
              onCompress={handleCompress}
              isProcessing={state === "compressing"}
            />
          )}

          {/* Processing Progress Indicator */}
          {state === "compressing" && progress && (
            <div className="p-6 rounded-xl border border-accent/40 bg-surface-base shadow-xl text-center space-y-4 animate-in fade-in duration-200">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent/10 border border-accent/30 text-accent animate-spin text-xl mx-auto">
                ⏳
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  {progress.stage}
                </h3>
                <p className="text-xs font-mono text-text-muted">
                  Iteration {progress.currentAttempt} of {progress.maxAttempts} • Target limit: {formatBytes(progress.targetBytes)}
                </p>
              </div>
              <div className="w-full bg-surface-raised h-2 rounded-full overflow-hidden max-w-md mx-auto">
                <div
                  className="bg-accent h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (progress.currentAttempt / progress.maxAttempts) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Result View */}
          {result && (state === "success" || state === "target-not-reached") && (
            <TargetResult
              result={result}
              onReset={handleClearFile}
              onAdjustTarget={() => setState("idle")}
            />
          )}
        </div>

        {/* Privacy Information Callout */}
        <div className="mt-8 p-4 sm:p-5 rounded-xl bg-surface-raised/40 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Processed locally in your browser. Uploaded document contents are never sent to a server.</span>
          </div>
          <Link href="/privacy" className="text-accent hover:underline shrink-0">
            Privacy Policy
          </Link>
        </div>

        {/* Non-intrusive AdSlot Placeholder */}
        <div className="pt-6">
          <AdSlot slotId="target-compressor-ad" format="horizontal" />
        </div>
      </Container>
    </div>
  );
}

export function TargetSizeCompressor() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs font-mono text-text-muted">
          Loading 1 MB Compressor...
        </div>
      }
    >
      <TargetSizeCompressorInner />
    </Suspense>
  );
}
