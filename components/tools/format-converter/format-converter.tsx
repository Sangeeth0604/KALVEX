"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./upload-zone";
import { DocumentSummary } from "./document-summary";
import { ConversionControls } from "./conversion-controls";
import { ConversionResult } from "./conversion-result";
import {
  ConversionResult as ResultType,
  ConversionSettings,
  ConverterError,
  ConverterState,
  LoadedSourceInfo,
} from "@/lib/tools/format-converter/types";
import {
  analyzeSourceDocument,
  convertDocument,
} from "@/lib/tools/format-converter/format-converter-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function FormatConverterInner() {
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [state, setState] = useState<ConverterState>("empty");
  const [source, setSource] = useState<LoadedSourceInfo | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<ConverterError | null>(null);

  const [settings, setSettings] = useState<ConversionSettings>({
    targetFormat: "image/webp",
    quality: 0.85,
    pageSelection: "all",
    pageRangeStart: 1,
    pageRangeEnd: 1,
  });

  const cleanupUrls = useCallback(() => {
    if (source?.previewUrl && source.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(source.previewUrl);
    }
    if (result?.pages) {
      result.pages.forEach((p) => {
        if (p.objectUrl && p.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(p.objectUrl);
        }
      });
    }
  }, [source, result]);

  useEffect(() => {
    return () => {
      cleanupUrls();
    };
  }, [cleanupUrls]);

  // Load document transferred from Document Bus via ?artifact=... or ?docId=...
  useEffect(() => {
    if (!artifactParam || source) return;

    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        setState("analyzing");
        analyzeSourceDocument(art.file, art.name)
          .then((info) => {
            setSource(info);
            // Set sensible target format
            if (info.inputType === "pdf") {
              setSettings((prev) => ({
                ...prev,
                targetFormat: "image/png",
                pageRangeEnd: info.pageCount,
              }));
            } else {
              const ext = info.name.split(".").pop()?.toLowerCase();
              setSettings((prev) => ({
                ...prev,
                targetFormat: ext === "png" ? "image/webp" : "image/png",
              }));
            }
            setState("ready");
          })
          .catch((err) => {
            setError(
              (err as ConverterError).message !== undefined
                ? (err as ConverterError)
                : { code: "CORRUPTED_FILE", message: "Failed to load transferred document." }
            );
            setState("error");
          });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [artifactParam, source]);

  const handleFileSelected = async (file: File) => {
    cleanupUrls();
    setError(null);
    setResult(null);
    setState("analyzing");

    try {
      const info = await analyzeSourceDocument(file, file.name);
      setSource(info);

      // Default target format recommendation
      if (info.inputType === "pdf") {
        setSettings((prev) => ({
          ...prev,
          targetFormat: "image/png",
          pageRangeEnd: info.pageCount,
        }));
      } else {
        const ext = file.name.split(".").pop()?.toLowerCase();
        setSettings((prev) => ({
          ...prev,
          targetFormat: ext === "png" ? "image/webp" : "image/png",
        }));
      }

      setState("ready");
    } catch (err) {
      setError(
        (err as ConverterError).message !== undefined
          ? (err as ConverterError)
          : { code: "CORRUPTED_FILE", message: "Failed to analyze document for conversion." }
      );
      setState("error");
    }
  };

  const handleUpdateSettings = (newSettings: Partial<ConversionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleConvert = async () => {
    if (!source) return;

    setState("converting");
    setError(null);

    try {
      const res = await convertDocument(source, settings);

      // Record into History
      historyManager.recordEntry({
        sourceTool: "format-converter",
        operationType: "convert",
        inputFilename: source.name,
        inputKind: source.inputType === "pdf" ? "pdf" : "image",
        inputSize: source.size,
        outputFilename: res.pages[0]?.fileName || "converted-output",
        outputKind: "image",
        outputSize: res.totalOutputSize,
        status: "success",
        outcome: `Converted to ${settings.targetFormat} (${res.pages.length} ${res.pages.length === 1 ? "Image" : "Images"})`,
        durationMs: res.durationMs,
        busArtifactId: res.busDocumentId,
        metadata: {
          formatFrom: source.inputType === "pdf" ? "PDF" : source.mimeType,
          formatTo: settings.targetFormat,
          pageCount: res.pages.length,
        },
      });

      setResult(res);
      setState("success");
    } catch (err) {
      setError(
        (err as ConverterError).message !== undefined
          ? (err as ConverterError)
          : { code: "CONVERSION_FAILED", message: "Format conversion failed." }
      );
      setState("ready");
    }
  };

  const handleReset = () => {
    cleanupUrls();
    setSource(null);
    setResult(null);
    setError(null);
    setState("empty");
  };

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6">
          <Link href="/tools" className="hover:text-accent transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-text-primary">Universal Format Converter</span>
        </div>

        {/* Header & Local Processing Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" dot>
                PROCESSING: LOCAL
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                In-Memory Client Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
              Universal Format Converter
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Convert between PNG, JPG, and WEBP image formats, or render PDF document pages into high-resolution images locally in your browser memory.
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

        {/* Analyzing State */}
        {state === "analyzing" && (
          <div className="max-w-xl mx-auto p-12 rounded-xl border border-border-default bg-surface-base text-center shadow-card">
            <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-base font-mono font-bold text-text-primary mb-1">
              Analyzing Document...
            </h3>
            <p className="text-xs text-text-muted font-mono">
              Reading file headers and dimensions into client memory
            </p>
          </div>
        )}

        {/* Ready / Conversion Settings State */}
        {(state === "ready" || state === "converting") && source && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <DocumentSummary
                source={source}
                onChangeFile={handleReset}
                disabled={state === "converting"}
              />
            </div>
            <div className="lg:col-span-7">
              <ConversionControls
                source={source}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onConvert={handleConvert}
                isConverting={state === "converting"}
              />
            </div>
          </div>
        )}

        {/* Success / Result State */}
        {state === "success" && source && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <DocumentSummary source={source} onChangeFile={handleReset} />
            </div>
            <div className="lg:col-span-7">
              <ConversionResult result={result} onReset={handleReset} />
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {state === "error" && !source && (
          <div className="max-w-xl mx-auto text-center p-8 rounded-xl border border-border-default bg-surface-base">
            <p className="text-sm text-text-secondary mb-4">
              Unable to proceed with format conversion.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleReset}
              className="font-mono text-xs"
            >
              Select Another File
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

export function FormatConverter() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-text-muted">
          Loading converter...
        </div>
      }
    >
      <FormatConverterInner />
    </Suspense>
  );
}
