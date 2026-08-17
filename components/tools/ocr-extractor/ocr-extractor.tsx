"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { UploadZone } from "./upload-zone";
import { DocumentPreview } from "./document-preview";
import { OcrProgress } from "./ocr-progress";
import { OcrResultViewer } from "./ocr-result-viewer";
import {
  LoadedDocumentInfo,
  OcrError,
  OcrProgress as ProgressType,
  OcrResult,
  OcrState,
} from "@/lib/tools/ocr-extractor/types";
import {
  loadDocumentInfo,
  runOcrExtraction,
  terminateOcrWorker,
} from "@/lib/tools/ocr-extractor/ocr-engine";

export function OcrExtractor() {
  const [state, setState] = useState<OcrState>("empty");
  const [docInfo, setDocInfo] = useState<LoadedDocumentInfo | null>(null);
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<OcrError | null>(null);

  // Cleanup object URLs and worker on component unmount
  useEffect(() => {
    return () => {
      if (docInfo?.previewUrl && docInfo.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(docInfo.previewUrl);
      }
      terminateOcrWorker();
    };
  }, [docInfo]);

  const handleFileSelected = async (file: File) => {
    if (docInfo?.previewUrl && docInfo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(docInfo.previewUrl);
    }

    setError(null);
    setResult(null);
    setProgress(null);
    setState("loading");

    try {
      const info = await loadDocumentInfo(file);
      setDocInfo(info);
      setState("processing");

      // Run local OCR extraction in worker
      const ocrRes = await runOcrExtraction(info, (p) => {
        setProgress(p);
      });

      setResult(ocrRes);
      setState("success");
    } catch (err) {
      const ocrErr: OcrError =
        (err as OcrError).message !== undefined
          ? (err as OcrError)
          : { code: "OCR_FAILED", message: "Failed to extract text from document." };
      setError(ocrErr);
      setState("error");
    }
  };

  const handleReset = useCallback(() => {
    if (docInfo?.previewUrl && docInfo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(docInfo.previewUrl);
    }
    setDocInfo(null);
    setProgress(null);
    setResult(null);
    setError(null);
    setState("empty");
  }, [docInfo]);

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link href="/tools" className="hover:text-accent transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-text-primary">Private OCR Text Extractor</span>
        </div>

        {/* Header & Local Processing Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" dot>
                PROCESSING: LOCAL
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                In-Memory WASM Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
              Private OCR Text Extractor
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Extract text from PNG, JPG, JPEG, WEBP images, and multi-page PDF documents locally in your browser using a dedicated WebAssembly worker.
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

        {/* Loading Document State */}
        {state === "loading" && (
          <div className="max-w-xl mx-auto p-12 rounded-xl border border-border-default bg-surface-base text-center shadow-card">
            <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-base font-mono font-bold text-text-primary mb-1">
              Preparing Document...
            </h3>
            <p className="text-xs text-text-muted font-mono">
              Loading file into client memory for OCR extraction
            </p>
          </div>
        )}

        {/* Active OCR Processing State */}
        {state === "processing" && docInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <DocumentPreview
                docInfo={docInfo}
                onChangeFile={handleReset}
                disabled={true}
              />
            </div>
            <div className="lg:col-span-7">
              <OcrProgress progress={progress} />
            </div>
          </div>
        )}

        {/* Success / Result State */}
        {state === "success" && docInfo && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <DocumentPreview
                docInfo={docInfo}
                onChangeFile={handleReset}
              />
            </div>
            <div className="lg:col-span-7">
              <OcrResultViewer result={result} onReset={handleReset} />
            </div>
          </div>
        )}

        {/* Error Fallback with Reset */}
        {state === "error" && !docInfo && (
          <div className="max-w-xl mx-auto text-center p-8 rounded-xl border border-border-default bg-surface-base">
            <p className="text-sm text-text-secondary mb-4">
              Unable to proceed with OCR extraction.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-mono text-xs font-bold cursor-pointer"
            >
              Try Another File
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
