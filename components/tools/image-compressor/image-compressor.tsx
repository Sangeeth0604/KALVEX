"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

export function ImageCompressor() {
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
          <span className="text-text-primary">Image Compressor</span>
        </div>

        {/* Header & Local Processing Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" dot>
                PROCESSING: LOCAL
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                Client Canvas Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
              Lossless & Optimized Image Compressor
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Compress PNG, JPG, JPEG, and WEBP images locally in your browser. Your image remains strictly on this device and is never transmitted to an external server.
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

        {/* Main Workspace Workflow */}
        {state === "idle" && (
          <div className="max-w-2xl mx-auto">
            <UploadZone
              onFileSelected={handleFileSelected}
              onError={(err) => {
                setError(err);
                setState("error");
              }}
            />
          </div>
        )}

        {(state === "file-selected" || state === "compressing") && metadata && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Preview & Metadata (5 cols) */}
            <div className="lg:col-span-5">
              <ImagePreview
                metadata={metadata}
                onChangeImage={handleReset}
                disabled={state === "compressing"}
              />
            </div>

            {/* Right Column: Compression Controls (7 cols) */}
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

        {state === "success" && metadata && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Original Image Preview (5 cols) */}
            <div className="lg:col-span-5">
              <ImagePreview
                metadata={metadata}
                onChangeImage={handleReset}
              />
            </div>

            {/* Right Column: Compression Result (7 cols) */}
            <div className="lg:col-span-7">
              <CompressionResult result={result} onReset={handleReset} />
            </div>
          </div>
        )}

        {state === "error" && !metadata && (
          <div className="max-w-xl mx-auto text-center p-8 rounded-xl border border-border-default bg-surface-base">
            <p className="text-sm text-text-secondary mb-4">
              Unable to proceed with image compression.
            </p>
            <Button variant="primary" size="md" onClick={handleReset}>
              Select Another Image
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
