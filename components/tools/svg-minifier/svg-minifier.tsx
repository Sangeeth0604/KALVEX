"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SvgMinifyResult, SvgMinifySettings } from "@/lib/tools/svg-minifier/types";
import { minifySvg } from "@/lib/tools/svg-minifier/svg-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function SvgMinifierInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [svgContent, setSvgContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("vector.svg");
  const [precision, setPrecision] = useState<number>(2);
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [removeComments, setRemoveComments] = useState(true);
  const [state, setState] = useState<"empty" | "ready" | "success" | "error">("empty");
  const [result, setResult] = useState<SvgMinifyResult | null>(null);

  const handleFile = useCallback(async (f: File) => {
    const text = await f.text();
    setSvgContent(text);
    setFileName(f.name);
    setResult(null);
    setState("ready");
  }, []);

  useEffect(() => {
    if (!artifactParam || svgContent) return;
    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art && art.file instanceof File) {
        handleFile(art.file);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [artifactParam, svgContent, handleFile]);

  const handleMinify = () => {
    if (!svgContent) return;
    try {
      const settings: SvgMinifySettings = {
        precision,
        removeMetadata,
        removeComments,
        removeEmptyContainers: true,
        collapseWhitespace: true,
      };

      const res = minifySvg(svgContent, settings, fileName);

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.outputBlob,
        name: `minified-${fileName}`,
        mimeType: "image/svg+xml",
        sourceTool: "svg-minifier",
        kind: "image",
        metadata: {
          savingsPercentage: res.reductionPercentage,
          originalSize: res.originalSize,
          minifiedSize: res.minifiedSize,
          durationMs: res.durationMs,
        },
      });

      res.busDocumentId = busDoc.id;

      // Record to History
      historyManager.recordEntry({
        sourceTool: "svg-minifier",
        operationType: "compress",
        inputFilename: fileName,
        inputKind: "image",
        inputSize: res.originalSize,
        outputFilename: `minified-${fileName}`,
        outputKind: "image",
        outputSize: res.minifiedSize,
        status: "success",
        outcome: `Minified -${res.reductionPercentage}% (${(res.originalSize / 1024).toFixed(1)} KB → ${(res.minifiedSize / 1024).toFixed(1)} KB)`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
      });

      setResult(res);
      setState("success");
    } catch (err) {
      console.error("SVG minification failed:", err);
      setState("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minified-${fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <span className="text-text-primary">SVG Vector Minifier</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Compress</Badge>
              <Badge variant="outline">Vector Optimizer</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              SVG Vector Minifier
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Clean vector paths, remove editor metadata (Inkscape, Illustrator, Figma), and reduce SVG footprint locally.
            </p>
          </div>
        </div>

        {state === "empty" && (
          <div className="rounded-xl border border-dashed border-border-default p-12 text-center bg-surface-raised/40">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary font-mono">Upload SVG to Minify</h3>
              <p className="text-xs text-text-muted font-mono">
                Select an SVG vector graphics file to clean and compress.
              </p>
              <input
                type="file"
                id="svg-input"
                className="hidden"
                accept=".svg,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById("svg-input")?.click()}
                className="font-mono text-xs font-bold"
              >
                Choose SVG File
              </Button>
            </div>
          </div>
        )}

        {state === "ready" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border border-border-default bg-surface-base p-6 space-y-6">
              <h3 className="text-sm font-bold font-mono text-text-primary uppercase border-b border-border-subtle pb-3">
                Minification Options
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeMetadata}
                    onChange={(e) => setRemoveMetadata(e.target.checked)}
                    className="rounded border-border-default text-accent"
                  />
                  <span className="text-xs font-mono text-text-primary">Strip editor metadata & namespaces (Inkscape/Illustrator/Figma)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeComments}
                    onChange={(e) => setRemoveComments(e.target.checked)}
                    className="rounded border-border-default text-accent"
                  />
                  <span className="text-xs font-mono text-text-primary">Remove comments & DOCTYPE</span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-mono text-text-muted">Coordinate Decimal Precision:</span>
                  <select
                    value={precision}
                    onChange={(e) => setPrecision(parseInt(e.target.value))}
                    className="px-3 py-1 rounded bg-surface-raised border border-border-default text-xs font-mono text-text-primary"
                  >
                    <option value="1">1 Decimal (Max compression)</option>
                    <option value="2">2 Decimals (Recommended)</option>
                    <option value="3">3 Decimals (High precision)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-end">
                <Button variant="primary" onClick={handleMinify} className="font-mono text-xs font-bold px-8">
                  ⚡ Minify SVG
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border-default bg-surface-base p-6 space-y-4 font-mono text-xs">
              <h3 className="font-bold text-text-primary uppercase border-b border-border-subtle pb-2">Original File</h3>
              <div className="space-y-2 text-text-muted">
                <div>Name: <span className="text-text-primary font-bold">{fileName}</span></div>
                <div>Size: <span className="text-text-primary font-bold">{(new Blob([svgContent]).size / 1024).toFixed(1)} KB</span></div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="w-full text-xs">
                Choose Different File
              </Button>
            </div>
          </div>
        )}

        {state === "success" && result && (
          <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle font-mono">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase">{result.fileName}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Saved {result.reductionPercentage}% in {result.durationMs} ms
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={handleDownload} className="font-mono text-xs font-bold">
                  Download Minified SVG
                </Button>
                {result.busDocumentId && (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/tools/format-converter?artifact=${result.busDocumentId}`)}
                    className="font-mono text-xs font-bold"
                  >
                    Convert Format ➔
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Original Size</span>
                <span className="text-base font-bold text-text-secondary">{(result.originalSize / 1024).toFixed(1)} KB</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Minified Size</span>
                <span className="text-base font-bold text-accent">{(result.minifiedSize / 1024).toFixed(1)} KB</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Savings</span>
                <span className="text-base font-bold text-accent">-{result.reductionPercentage}%</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="font-mono text-xs">
                Minify Another SVG
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export function SvgMinifier() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading SVG Minifier...</div>}>
      <SvgMinifierInner />
    </Suspense>
  );
}
