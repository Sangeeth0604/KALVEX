"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RedactionRule,
  SanitizerResult,
  SanitizerSettings,
} from "@/lib/tools/document-sanitizer/types";
import {
  sanitizeDocument,
  COMMON_PII_RULES,
} from "@/lib/tools/document-sanitizer/sanitizer-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function DocumentSanitizerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"empty" | "ready" | "processing" | "success" | "error">("empty");
  const [stripMetadata, setStripMetadata] = useState(true);
  const [activeRules, setActiveRules] = useState<RedactionRule[]>([...COMMON_PII_RULES]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [result, setResult] = useState<SanitizerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setState("ready");
  }, []);

  useEffect(() => {
    if (!artifactParam || file) return;
    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        const fileObj =
          art.file instanceof File
            ? art.file
            : new File([art.file], art.name, { type: art.mimeType });
        handleFileSelect(fileObj);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [artifactParam, file, handleFileSelect]);

  const handleAddKeyword = () => {
    if (!customKeyword.trim()) return;
    const newRule: RedactionRule = {
      id: `custom-${Date.now()}`,
      type: "text_keyword",
      target: customKeyword.trim(),
      replacementLabel: "[REDACTED]",
    };
    setActiveRules((prev) => [...prev, newRule]);
    setCustomKeyword("");
  };

  const handleRemoveRule = (id: string) => {
    setActiveRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSanitize = async () => {
    if (!file) return;
    setState("processing");
    setError(null);

    try {
      const settings: SanitizerSettings = {
        stripMetadata,
        stripHiddenLayers: true,
        redactionRules: activeRules,
      };

      const res = await sanitizeDocument(file, settings);

      // Register into Document Bus
      const busDoc = documentBus.publishArtifact({
        file: res.outputBlob,
        name: res.outputName,
        mimeType: res.outputBlob.type,
        sourceTool: "document-sanitizer",
        kind: res.outputBlob.type.includes("pdf") ? "pdf" : "text",
        metadata: {
          redactions: res.redactedCount,
          metadataStripped: res.metadataFieldsStripped.length,
          durationMs: res.durationMs,
        },
      });

      res.busDocumentId = busDoc.id;

      // Log to History
      historyManager.recordEntry({
        sourceTool: "document-sanitizer",
        operationType: "sanitize",
        inputFilename: file.name,
        inputKind: file.type.includes("pdf") ? "pdf" : "text",
        inputSize: file.size,
        outputFilename: res.outputName,
        outputKind: res.outputBlob.type.includes("pdf") ? "pdf" : "text",
        outputSize: res.sanitizedSize,
        status: "success",
        outcome: `Sanitized (${res.redactedCount} redactions, ${res.metadataFieldsStripped.length} metadata fields stripped)`,
        durationMs: res.durationMs,
        busArtifactId: busDoc.id,
      });

      setResult(res);
      setState("success");
    } catch (err) {
      console.error("Sanitizer error:", err);
      setError(err instanceof Error ? err.message : "Failed to sanitize document.");
      setState("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outputName;
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
          <span className="text-text-primary">Document Sanitizer & Redactor</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Create & Protect</Badge>
              <Badge variant="outline">Privacy Engine</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Document Sanitizer & Redactor
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Permanently scrub sensitive text areas, emails, SSNs, and remove hidden metadata tags from PDFs and text documents.
            </p>
          </div>
        </div>

        {state === "empty" && (
          <div className="rounded-xl border border-dashed border-border-default p-12 text-center bg-surface-raised/40">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary font-mono">Select Document to Sanitize</h3>
              <p className="text-xs text-text-muted font-mono">
                Upload a PDF or TXT file to configure metadata scrubbing and permanent text redactions.
              </p>
              <input
                type="file"
                id="sanitizer-file-input"
                className="hidden"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById("sanitizer-file-input")?.click()}
                className="font-mono text-xs font-bold"
              >
                Choose Document
              </Button>
            </div>
          </div>
        )}

        {state === "ready" && file && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Settings Column */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl border border-border-default bg-surface-base p-6 space-y-6">
                <h3 className="text-sm font-bold font-mono text-text-primary uppercase border-b border-border-subtle pb-3">
                  Sanitization Configuration
                </h3>

                {/* Metadata checkbox */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    className="rounded border-border-default text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="text-xs font-bold font-mono text-text-primary block">Strip All Metadata & XML Streams</span>
                    <span className="text-[11px] text-text-muted font-mono">Purges Author, Title, Creator, Producer, CreationDate, and XMP metadata streams.</span>
                  </div>
                </label>

                {/* Redaction Rules */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <span className="text-xs font-bold font-mono text-text-primary block">Active Redaction Patterns</span>
                  <div className="flex flex-wrap gap-2">
                    {activeRules.map((r) => (
                      <span
                        key={r.id}
                        className="text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-raised border border-border-subtle text-text-primary flex items-center gap-2"
                      >
                        <span>{r.type.startsWith("pattern_") ? r.type.replace("pattern_", "Auto: ").toUpperCase() : `Word: "${r.target}"`}</span>
                        <button onClick={() => handleRemoveRule(r.id)} className="text-text-danger font-bold">✕</button>
                      </span>
                    ))}
                  </div>

                  {/* Add Custom Word */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add sensitive keyword/phrase..."
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                      className="flex-1 text-xs font-mono px-3 py-2 rounded-lg bg-surface-raised border border-border-default text-text-primary"
                    />
                    <Button variant="secondary" size="sm" onClick={handleAddKeyword} className="font-mono text-xs">
                      + Add Rule
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <Button variant="primary" onClick={handleSanitize} className="font-mono text-xs font-bold px-6">
                    🛡️ Apply Redaction & Sanitize
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Info Column */}
            <div className="rounded-xl border border-border-default bg-surface-base p-6 space-y-4 font-mono text-xs">
              <h3 className="font-bold text-text-primary uppercase border-b border-border-subtle pb-2">Target Document</h3>
              <div className="space-y-2 text-text-muted">
                <div>Name: <span className="text-text-primary font-bold">{file.name}</span></div>
                <div>Size: <span className="text-text-primary font-bold">{(file.size / 1024).toFixed(1)} KB</span></div>
                <div>Format: <span className="text-text-primary uppercase font-bold">{file.type || "PDF"}</span></div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="w-full text-xs">
                Choose Different File
              </Button>
            </div>
          </div>
        )}

        {state === "processing" && (
          <div className="rounded-xl border border-border-default bg-surface-base p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mb-4" />
            <p className="text-sm font-mono font-bold text-text-primary">Permanently burning redactions and stripping metadata...</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-xl border border-border-danger bg-surface-base p-8 text-center space-y-4">
            <p className="text-sm font-mono text-text-danger font-bold">{error || "Sanitization failed."}</p>
            <Button variant="secondary" onClick={() => setState("ready")} className="font-mono text-xs">
              Back to Configuration
            </Button>
          </div>
        )}

        {state === "success" && result && (
          <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle font-mono">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase">{result.outputName}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Sanitized in {result.durationMs} ms • {result.redactedCount} text instances redacted
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={handleDownload} className="font-mono text-xs font-bold">
                  Download Sanitized File
                </Button>
                {result.busDocumentId && (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/ai-workspace?artifact=${result.busDocumentId}`)}
                    className="font-mono text-xs font-bold"
                  >
                    ✨ Open in AI Workspace ➔
                  </Button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Redactions Applied</span>
                <span className="text-base font-bold text-accent">{result.redactedCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Metadata Stripped</span>
                <span className="text-base font-bold text-text-primary">{result.metadataFieldsStripped.length} Fields</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block mb-1">Sanitized Size</span>
                <span className="text-base font-bold text-text-primary">{(result.sanitizedSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="font-mono text-xs">
                Sanitize Another Document
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export function DocumentSanitizer() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading Document Sanitizer...</div>}>
      <DocumentSanitizerInner />
    </Suspense>
  );
}
