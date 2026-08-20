"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./upload-zone";
import { ImagePreview } from "./image-preview";
import { CompressionControls } from "./compression-controls";
import { CompressionResult } from "./compression-result";
import {
  CompressionError,
  CompressionResult as ResultType,
  CompressionSettings,
  CompressionState,
  ImageMetadata,
} from "@/lib/tools/image-compressor/types";
import {
  compressImage,
  readImageMetadata,
} from "@/lib/tools/image-compressor/image-compressor";
import { documentBus } from "@/lib/document-bus/document-bus";

function ImageCompressorInner() {
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [state, setState] = useState<CompressionState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<CompressionError | null>(null);

  const [settings, setSettings] = useState<CompressionSettings>({
    outputFormat: "original",
    quality: 0.75,
    qualityPreset: "balanced",
  });

  // Memory Cleanup Utility
  const cleanupUrls = useCallback(() => {
    if (metadata?.objectUrl) {
      URL.revokeObjectURL(metadata.objectUrl);
    }
    if (result?.objectUrl && result.objectUrl !== metadata?.objectUrl) {
      URL.revokeObjectURL(result.objectUrl);
    }
    if (
      result?.effectiveObjectUrl &&
      result.effectiveObjectUrl !== metadata?.objectUrl &&
      result.effectiveObjectUrl !== result.objectUrl
    ) {
      URL.revokeObjectURL(result.effectiveObjectUrl);
    }
  }, [metadata, result]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      cleanupUrls();
    };
  }, [cleanupUrls]);

  // Handle incoming document from Document Bus via ?artifact=... or ?docId=...
  useEffect(() => {
    if (!artifactParam || metadata) return;

    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        const fileObj =
          art.file instanceof File
            ? art.file
            : new File([art.file], art.name, { type: art.mimeType });

        readImageMetadata(fileObj)
          .then((meta) => {
            setFile(fileObj);
            setMetadata(meta);
            setState("file-selected");
          })
          .catch((err) => {
            setError(
              (err as CompressionError).message !== undefined
                ? (err as CompressionError)
                : { code: "DECODE_FAILED", message: "Failed to read transferred image file." }
            );
            setState("error");
          });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [artifactParam, metadata]);

  const handleFileSelected = async (selectedFile: File) => {
    cleanupUrls();
    setError(null);
    setResult(null);

    try {
      const meta = await readImageMetadata(selectedFile);
      setFile(selectedFile);
      setMetadata(meta);
      setState("file-selected");
    } catch (err) {
      const compError: CompressionError =
        (err as CompressionError).message !== undefined
          ? (err as CompressionError)
          : { code: "DECODE_FAILED", message: "Failed to read image file." };
      setError(compError);
      setState("error");
    }
  };

  const handleUpdateSettings = (newSettings: Partial<CompressionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleCompress = async () => {
    if (!file || !metadata) return;

    setState("compressing");
    setError(null);

    try {
      const res = await compressImage(file, settings, metadata);

      // Register compressed output into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.effectiveBlob,
        name: res.effectiveFileName,
        mimeType: res.outputMimeType,
        sourceTool: "image-compressor",
        kind: "image",
        previewUrl: res.effectiveObjectUrl,
        metadata: {
          width: res.width,
          height: res.height,
          savingsPercentage: res.savingsPercentage,
          reductionBytes: res.reductionBytes,
          durationMs: res.durationMs,
        },
      });

      res.busDocumentId = busDoc.id;
      setResult(res);
      setState("success");
    } catch (err) {
      const compError: CompressionError =
        (err as CompressionError).message !== undefined
          ? (err as CompressionError)
          : { code: "ENCODE_FAILED", message: "Image compression failed in browser." };
      setError(compError);
      setState("error");
    }
  };

  const handleReset = () => {
    cleanupUrls();
    setFile(null);
    setMetadata(null);
    setResult(null);
    setError(null);
    setState("idle");
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
          <span className="text-text-primary">Lossless Image Compressor</span>
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
              Lossless Image Compressor
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Compress PNG, JPG, and WEBP images directly inside your browser. No files are uploaded to any server.
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
        {state === "idle" && (
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

        {/* Ready / File Selected State */}
        {(state === "file-selected" || state === "compressing") && metadata && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <ImagePreview
                metadata={metadata}
                onChangeImage={handleReset}
                disabled={state === "compressing"}
              />
            </div>
            <div className="lg:col-span-7">
              <CompressionControls
                metadata={metadata}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onCompress={handleCompress}
                isCompressing={state === "compressing"}
              />
            </div>
          </div>
        )}

        {/* Success / Result State */}
        {state === "success" && metadata && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <ImagePreview metadata={metadata} onChangeImage={handleReset} />
            </div>
            <div className="lg:col-span-7">
              <CompressionResult result={result} onReset={handleReset} />
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {state === "error" && !metadata && (
          <div className="max-w-xl mx-auto text-center p-8 rounded-xl border border-border-default bg-surface-base">
            <p className="text-sm text-text-secondary mb-4">
              Unable to proceed with image compression.
            </p>
            <Button variant="primary" size="md" onClick={handleReset} className="font-mono text-xs">
              Select Another Image
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

export function ImageCompressor() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-text-muted">
          Loading compressor...
        </div>
      }
    >
      <ImageCompressorInner />
    </Suspense>
  );
}
