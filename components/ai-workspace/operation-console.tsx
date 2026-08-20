"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AiOperationOptions,
  AiOperationResult,
  AiOperationType,
  DocumentContext,
  SummaryResult,
  ExtractedDataResult,
  ExplanationResult,
  AnswerResult,
} from "@/lib/ai-workspace/types";
import { OPERATION_REGISTRY } from "@/lib/ai-workspace/operation-registry";
import { documentBus } from "@/lib/document-bus";

interface OperationConsoleProps {
  context?: DocumentContext | null;
  activeOperation: AiOperationType;
  onSelectOperation: (op: AiOperationType) => void;
  onExecuteOperation: (op: AiOperationType, options?: AiOperationOptions) => Promise<void>;
  isProcessing: boolean;
  processingStage: string;
  currentResult: AiOperationResult | null;
  onSelectCitation?: (page: number, excerpt: string) => void;
}

export function OperationConsole({
  context,
  activeOperation,
  onSelectOperation,
  onExecuteOperation,
  isProcessing,
  processingStage,
  currentResult,
  onSelectCitation,
}: OperationConsoleProps) {
  const [detailLevel, setDetailLevel] = useState<"brief" | "standard" | "detailed">("standard");
  const [customQuery, setCustomQuery] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [viewMode, setViewMode] = useState<"rendered" | "json" | "markdown">("rendered");
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [busPublishedId, setBusPublishedId] = useState<string | null>(null);

  const opDef = OPERATION_REGISTRY[activeOperation];

  const handleRun = () => {
    onExecuteOperation(activeOperation, {
      detailLevel,
      customQuery: customQuery.trim() || undefined,
      focusArea: focusArea.trim() || undefined,
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePublishToBus = () => {
    if (!currentResult || !context) return;

    const baseName = context.filename.replace(/\.[^/.]+$/, "");
    const outputName = `${baseName}-${currentResult.operation}-result.json`;
    const jsonString = JSON.stringify(currentResult.structuredData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    const published = documentBus.publishArtifact({
      name: outputName,
      mimeType: "application/json",
      sourceTool: "ai-workspace",
      kind: "text",
      file: blob,
      metadata: {
        operation: currentResult.operation,
        sourceDocument: context.filename,
        durationMs: currentResult.metrics.durationMs,
        provider: currentResult.metrics.providerName,
      },
    });

    setBusPublishedId(published.id);
    setTimeout(() => setBusPublishedId(null), 3000);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
      {/* Operation Tabs Navigation */}
      <div className="p-2 bg-surface-raised border-b border-border-subtle flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {(
            [
              "summarize",
              "extract_key_info",
              "explain_simply",
              "targeted_qa",
            ] as AiOperationType[]
          ).map((op) => {
            const def = OPERATION_REGISTRY[op];
            const isActive = activeOperation === op;
            return (
              <button
                key={op}
                type="button"
                onClick={() => onSelectOperation(op)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-surface-base text-accent font-semibold border border-border-default shadow-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <span>{def.icon}</span>
                <span>{def.title}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-accent hidden lg:inline-block pr-2 font-semibold">
          ● Grounded Task Engine
        </span>
      </div>

      {/* Operation Configuration Bar */}
      <div className="p-4 bg-surface-raised/30 border-b border-border-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold font-mono text-text-primary flex items-center gap-2">
              <span>{opDef.icon}</span>
              <span>{opDef.title}</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">{opDef.shortDescription}</p>
          </div>

          {/* Operation Parameters */}
          <div className="flex items-center gap-2 shrink-0">
            {activeOperation === "summarize" && (
              <div className="flex items-center gap-1 bg-surface-base px-2 py-1 rounded border border-border-subtle text-[11px] font-mono">
                <span className="text-text-muted">Detail:</span>
                {(["brief", "standard", "detailed"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDetailLevel(lvl)}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      detailLevel === lvl
                        ? "bg-accent text-bg-primary font-bold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              disabled={isProcessing || !context}
              className="font-mono text-xs font-bold"
            >
              {isProcessing ? "Processing..." : `Run ${opDef.title}`}
            </Button>
          </div>
        </div>

        {/* Custom Query for Q&A */}
        {activeOperation === "targeted_qa" && (
          <div className="space-y-2 pt-1">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g. What are the termination clauses, liability caps, or renewal dates?"
              className="w-full px-3.5 py-2 bg-surface-base border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-sans"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-text-muted">Suggested:</span>
              {[
                "What is the total financial amount or fee structure?",
                "What are the primary liability limitations?",
                "What are the data retention and purge obligations?",
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCustomQuery(q)}
                  className="text-[10px] font-sans text-text-secondary hover:text-text-primary bg-surface-base hover:bg-surface-hover px-2 py-0.5 rounded border border-border-subtle transition-colors cursor-pointer truncate max-w-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Optional Focus Area for Explain Simply */}
        {activeOperation === "explain_simply" && (
          <div className="pt-1">
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="Optional focus: e.g. indemnification, license grant, or termination penalty"
              className="w-full px-3 py-1.5 bg-surface-base border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-sans"
            />
          </div>
        )}
      </div>

      {/* Main Results / Execution Area */}
      <div className="flex-1 flex flex-col justify-between p-4 max-h-[520px] overflow-y-auto space-y-4">
        {/* Processing Banner */}
        {isProcessing && (
          <div className="p-6 rounded-xl bg-surface-raised border border-border-accent/50 text-center space-y-3 animate-pulse">
            <div className="h-8 w-8 mx-auto rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold text-text-primary">
                Executing {opDef.title}
              </h4>
              <p className="text-[11px] font-mono text-accent">{processingStage}</p>
            </div>
          </div>
        )}

        {/* Empty Context Notice */}
        {!isProcessing && !currentResult && (
          <div className="p-12 text-center space-y-3 font-mono">
            <span className="text-3xl block">{opDef.icon}</span>
            <h4 className="text-sm font-bold text-text-primary">
              Ready to {opDef.title}
            </h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {context
                ? `Click "Run ${opDef.title}" to analyze ${context.filename} (~${context.estimatedTokens.toLocaleString()} tokens).`
                : "Load a document from the Document Bus or upload a file on the left to begin intelligence operations."}
            </p>
          </div>
        )}

        {/* Structured Result Viewer */}
        {!isProcessing && currentResult && (
          <div className="space-y-4">
            {/* View Mode & Metrics Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border-subtle">
                {(["rendered", "json", "markdown"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded capitalize transition-colors ${
                      viewMode === mode
                        ? "bg-surface-base text-accent font-bold shadow-subtle"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-mono text-text-muted flex items-center gap-2 flex-wrap">
                {currentResult.metrics.isSimulated && (
                  <span className="bg-warning/10 text-warning border border-warning/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    SIMULATED TEST MODE
                  </span>
                )}
                <span>{currentResult.metrics.providerName}</span>
                <span>•</span>
                <span>{currentResult.metrics.durationMs} ms</span>
                <span>•</span>
                <span className="text-accent">~{currentResult.metrics.outputTokensEstimated} Out Tokens</span>
              </div>
            </div>

            {/* View Mode: JSON Schema */}
            {viewMode === "json" && (
              <pre className="p-4 bg-surface-raised rounded-xl border border-border-default font-mono text-[11px] text-text-primary overflow-x-auto max-h-[380px]">
                {JSON.stringify(currentResult.structuredData, null, 2)}
              </pre>
            )}

            {/* View Mode: Markdown */}
            {viewMode === "markdown" && (
              <pre className="p-4 bg-surface-raised rounded-xl border border-border-default font-mono text-[11px] text-text-secondary overflow-x-auto whitespace-pre-wrap max-h-[380px]">
                {currentResult.markdownContent}
              </pre>
            )}

            {/* View Mode: Rendered Rich Cards */}
            {viewMode === "rendered" && (
              <div className="space-y-4">
                {/* 1. Summarize View */}
                {currentResult.operation === "summarize" && (
                  <div className="space-y-3.5">
                    {(() => {
                      const s = currentResult.structuredData as SummaryResult;
                      return (
                        <>
                          <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1.5">
                            <h4 className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                              {s.title}
                            </h4>
                            <p className="text-xs text-text-primary leading-relaxed font-sans">
                              {s.executiveSummary}
                            </p>
                          </div>

                          {s.keyTakeaways && s.keyTakeaways.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-surface-base border border-border-default space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Key Takeaways
                              </h5>
                              <ul className="space-y-1.5">
                                {s.keyTakeaways.map((t, idx) => (
                                  <li key={idx} className="text-xs text-text-secondary flex items-start gap-2">
                                    <span className="text-accent font-bold mt-0.5">✓</span>
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {s.actionItems && s.actionItems.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-surface-base border border-border-default space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Action Items
                              </h5>
                              <div className="space-y-2">
                                {s.actionItems.map((a, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="text-text-primary font-medium">{a.task}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {a.owner && (
                                        <span className="text-[10px] font-mono text-text-muted">
                                          {a.owner}
                                        </span>
                                      )}
                                      <span
                                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                          a.priority === "high"
                                            ? "bg-error/10 text-error border border-error/30"
                                            : a.priority === "medium"
                                            ? "bg-warning/10 text-warning border border-warning/30"
                                            : "bg-accent/10 text-accent border border-border-accent"
                                        }`}
                                      >
                                        {a.priority}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 2. Extract Key Info View */}
                {currentResult.operation === "extract_key_info" && (
                  <div className="space-y-3.5">
                    {(() => {
                      const d = currentResult.structuredData as ExtractedDataResult;
                      return (
                        <>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-border-subtle text-xs font-mono">
                            <span className="text-text-muted">Document Classification:</span>
                            <span className="text-accent font-bold">{d.documentType}</span>
                          </div>

                          {/* Parties */}
                          {d.parties && d.parties.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-surface-base border border-border-default space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Identified Parties
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {d.parties.map((p, idx) => (
                                  <div key={idx} className="p-2 rounded bg-surface-raised border border-border-subtle text-xs font-mono">
                                    <div className="font-bold text-text-primary">{p.name}</div>
                                    <div className="text-text-muted text-[11px]">{p.role}{p.jurisdiction ? ` • ${p.jurisdiction}` : ""}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Key Dates */}
                          {d.keyDates && d.keyDates.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-surface-base border border-border-default space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Key Dates & Milestones
                              </h5>
                              <div className="space-y-1.5">
                                {d.keyDates.map((dt, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-surface-raised text-xs font-mono">
                                    <span className="text-text-secondary">{dt.label}</span>
                                    <span className="font-bold text-text-primary flex items-center gap-1.5">
                                      {dt.isDeadline && <span className="text-error">🚨</span>}
                                      {dt.date}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Financials & Obligations */}
                          {d.financials && d.financials.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-surface-base border border-border-default space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Financial Metrics
                              </h5>
                              <div className="space-y-1.5">
                                {d.financials.map((f, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-surface-raised text-xs font-mono">
                                    <span className="text-text-secondary">{f.description}</span>
                                    <span className="font-bold text-accent">{f.amount} {f.currency}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 3. Explain Simply View */}
                {currentResult.operation === "explain_simply" && (
                  <div className="space-y-3.5">
                    {(() => {
                      const e = currentResult.structuredData as ExplanationResult;
                      return (
                        <>
                          <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1.5">
                            <h5 className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider">
                              Plain English Overview
                            </h5>
                            <p className="text-xs text-text-primary leading-relaxed font-sans">
                              {e.simplifiedOverview}
                            </p>
                          </div>

                          {e.coreConcepts && e.coreConcepts.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Key Terminology Breakdown
                              </h5>
                              {e.coreConcepts.map((c, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-surface-base border border-border-default space-y-1">
                                  <div className="text-xs font-bold text-accent font-mono">{c.term}</div>
                                  <div className="text-xs text-text-secondary">{c.plainEnglishMeaning}</div>
                                  <div className="text-[11px] text-text-muted pt-1 border-t border-border-subtle/50">
                                    <strong>Why it matters:</strong> {c.whyItMatters}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 4. Targeted Q&A View */}
                {currentResult.operation === "targeted_qa" && (
                  <div className="space-y-3.5">
                    {(() => {
                      const a = currentResult.structuredData as AnswerResult;
                      return (
                        <>
                          <div className="p-4 rounded-xl bg-surface-raised border border-border-accent/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-accent font-bold">
                                Direct Answer
                              </span>
                              <span className="text-[10px] font-mono text-text-muted bg-surface-base px-2 py-0.5 rounded border border-border-subtle uppercase">
                                Confidence: {a.confidenceScore || "HIGH"}
                              </span>
                            </div>
                            <p className="text-xs text-text-primary leading-relaxed font-sans">
                              {a.directAnswer}
                            </p>
                          </div>

                          {a.evidenceQuotes && a.evidenceQuotes.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                                Grounded Document Excerpts
                              </h5>
                              {a.evidenceQuotes.map((q, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => onSelectCitation?.(q.pageNumber, q.quote)}
                                  className="p-3 rounded-lg bg-surface-base border border-border-default hover:border-border-accent cursor-pointer transition-colors space-y-1.5"
                                >
                                  <p className="text-xs font-mono text-text-secondary italic">
                                    &ldquo;{q.quote}&rdquo;
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                                    <span>Page {q.pageNumber}</span>
                                    <span className="text-accent">{q.context || "Verified Clause"}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      {currentResult && (
        <div className="p-3 bg-surface-raised border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(JSON.stringify(currentResult.structuredData, null, 2), "JSON")}
              className="text-xs font-mono"
            >
              {copiedStatus === "JSON" ? "✓ Copied JSON" : "Copy JSON"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(currentResult.markdownContent, "Markdown")}
              className="text-xs font-mono"
            >
              {copiedStatus === "Markdown" ? "✓ Copied MD" : "Copy MD"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDownload(
                  JSON.stringify(currentResult.structuredData, null, 2),
                  `${context?.filename || "document"}-${currentResult.operation}.json`,
                  "application/json"
                )
              }
              className="text-xs font-mono"
            >
              Save .JSON
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublishToBus}
              className="text-xs font-mono font-bold"
            >
              {busPublishedId ? "✓ Saved to Document Bus" : "Publish to Bus"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
