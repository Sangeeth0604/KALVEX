"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./upload-zone";
import { DocumentSummary } from "./document-summary";
import { OptimizationControls } from "./optimization-controls";
import { OptimizationResult } from "./optimization-result";
import {
  DEFAULT_OPTIMIZATION_SETTINGS,
  analyzePdfDocument,
  optimizePdf,
} from "@/lib/tools/pdf-optimizer/pdf-engine";
import {
  OptimizationResult as ResultType,
  OptimizationSettings,
  OptimizerState,
  PdfDocAnalysis,
  PdfOptimizerError,
} from "@/lib/tools/pdf-optimizer/types";

export function PdfOptimizer() {
  const [state, setState] = useState<OptimizerState>("empty");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PdfDocAnalysis | null>(null);
  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_OPTIMIZATION_SETTINGS);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<PdfOptimizerError | null>(null);

  // Memory Cleanup Utility
  const cleanupUrls = useCallback(() => {
    if (result?.candidateObjectUrl) {
      URL.revokeObjectURL(result.candidateObjectUrl);
    }
    if (result?.effectiveObjectUrl && result.effectiveObjectUrl !== result.candidateObjectUrl) {
      URL.revokeObjectURL(result.effectiveObjectUrl);
    }
  }, [result]);

  useEffect(() => {
    return () => {
      cleanupUrls();
    };
  }, [cleanupUrls]);

  const handleFileSelected = async (selectedFile: File) => {
    cleanupUrls();
    setError(null);
    setResult(null);
    setState("analyzing");

    try {
      const docAnalysis = await analyzePdfDocument(selectedFile);
      setFile(selectedFile);
      setAnalysis(docAnalysis);
      setState("ready");
    } catch (err) {
      const optErr: PdfOptimizerError =
        (err as PdfOptimizerError).message !== undefined
          ? (err as PdfOptimizerError)
          : { code: "CORRUPTED_PDF", message: "Failed to analyze PDF document." };
      setError(optErr);
      setState("error");
    }
  };

  const handleUpdateSettings = (newSettings: Partial<OptimizationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleOptimize = async () => {
    if (!file || !analysis) return;

    setState("optimizing");
    setError(null);

    try {
      const res = await optimizePdf(file, settings);
      setResult(res);
      setState("success");
    } catch (err) {
      const optErr: PdfOptimizerError =
        (err as PdfOptimizerError).message !== undefined
          ? (err as PdfOptimizerError)
          : { code: "OPTIMIZATION_FAILED", message: "PDF optimization failed in browser." };
      setError(optErr);
      setState("ready");
    }
  };

  const handleReset = () => {
    cleanupUrls();
    setFile(null);
    setAnalysis(null);
    setResult(null);
    setError(null);
    setState("empty");
  };

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link href="/tools" className="hover:text-accent transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-text-primary">PDF Stream & Structure Optimizer</span>
        </div>

        {/* Header & Local Processing Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" dot>
                PROCESSING: LOCAL
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                Lossless-First Stream Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
              PDF Stream & Structure Optimizer
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Optimize PDF document structure, pack cross-reference tables into binary Object Streams, prune historical edit revisions, and scrub metadata locally in your browser memory.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-raised p-3 rounded-lg border border-border-subtle shrink-0">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>In-Memory Browser Execution</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-error-subtle/50 border border-error text-error text-xs font-mono flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm">✕</span>
              <span>{error.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs underline cursor-pointer hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Empty Upload State */}
        {state === "empty" && (
          <div className="max-w-3xl mx-auto">
            <UploadZone
              onFileSelected={handleFileSelected}
              onError={(err) => {
                setError(err);
                setState("error");
              }}
            />
          </div>
        )}

        {/* Analyzing Document State */}
        {state === "analyzing" && (
          <div className="max-w-xl mx-auto p-12 rounded-xl border border-border-default bg-surface-base text-center shadow-card">
            <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-base font-mono font-bold text-text-primary mb-1">
              Analyzing PDF Document...
            </h3>
            <p className="text-xs text-text-muted font-mono">
              Parsing object tables, metadata streams, and page trees in client memory
            </p>
          </div>
        )}

        {/* Ready / Optimization Settings State */}
        {(state === "ready" || state === "optimizing") && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <DocumentSummary
                analysis={analysis}
                onChangeFile={handleReset}
                disabled={state === "optimizing"}
              />
            </div>
            <div className="lg:col-span-7">
              <OptimizationControls
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onOptimize={handleOptimize}
                isOptimizing={state === "optimizing"}
              />
            </div>
          </div>
        )}

        {/* Success / Result State */}
        {state === "success" && analysis && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <DocumentSummary
                analysis={analysis}
                onChangeFile={handleReset}
              />
            </div>
            <div className="lg:col-span-7">
              <OptimizationResult
                result={result}
                onReset={handleReset}
              />
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {state === "error" && !analysis && (
          <div className="max-w-xl mx-auto text-center p-8 rounded-xl border border-border-default bg-surface-base">
            <p className="text-sm text-text-secondary mb-4">
              Unable to proceed with PDF optimization.
            </p>
            <Button variant="primary" size="md" onClick={handleReset} className="font-mono text-xs">
              Select Another PDF
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
