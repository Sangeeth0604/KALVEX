"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TableExportFormat,
  TableParserError,
  TableParserResult,
} from "@/lib/tools/table-parser/types";
import {
  exportTableToBlob,
  extractTablesFromDocument,
} from "@/lib/tools/table-parser/table-engine";
import { documentBus } from "@/lib/document-bus/document-bus";
import { historyManager } from "@/lib/history";

function TableParserInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [state, setState] = useState<"empty" | "analyzing" | "parsed" | "error">("empty");
  const [result, setResult] = useState<TableParserResult | null>(null);
  const [activeTableIdx, setActiveTableIdx] = useState<number>(0);
  const [error, setError] = useState<TableParserError | null>(null);

  const handleFileProcess = useCallback(async (file: File) => {
    setState("analyzing");
    setError(null);
    const start = performance.now();

    try {
      const { tables, rawText } = await extractTablesFromDocument(file);
      if (tables.length === 0) {
        throw { code: "NO_TABLE_FOUND", message: "Could not identify table structure in file." };
      }

      const durationMs = Math.max(1, Math.round(performance.now() - start));
      const parserResult: TableParserResult = {
        fileName: file.name,
        fileSize: file.size,
        tables,
        rawText,
        durationMs,
      };

      // Register primary CSV export into Document Bus
      const primaryTable = tables[0];
      const csvBlob = exportTableToBlob(primaryTable, "csv");
      const busDoc = documentBus.publishArtifact({
        file: csvBlob,
        name: `${file.name.replace(/\.[^/.]+$/, "")}-table.csv`,
        mimeType: "text/csv",
        sourceTool: "table-parser",
        kind: "text",
        metadata: {
          rowCount: primaryTable.rowCount,
          columnCount: primaryTable.columnCount,
          durationMs,
        },
      });

      parserResult.busDocumentId = busDoc.id;

      // Record to History
      historyManager.recordEntry({
        sourceTool: "table-parser",
        operationType: "table-parse",
        inputFilename: file.name,
        inputKind: file.type.includes("pdf") ? "pdf" : "text",
        inputSize: file.size,
        outputFilename: `${file.name.replace(/\.[^/.]+$/, "")}-table.csv`,
        outputKind: "text",
        outputSize: csvBlob.size,
        status: "success",
        outcome: `Extracted ${primaryTable.rowCount} Rows × ${primaryTable.columnCount} Columns`,
        durationMs,
        busArtifactId: busDoc.id,
      });

      setResult(parserResult);
      setActiveTableIdx(0);
      setState("parsed");
    } catch (err) {
      console.error("Table parse error:", err);
      const errMsg =
        err instanceof Error
          ? err.message
          : (err as TableParserError)?.message || "Failed to parse tabular data.";
      setError({ code: "PARSE_FAILED", message: errMsg });
      setState("error");
    }
  }, []);

  // Handle incoming bus document
  useEffect(() => {
    if (!artifactParam) return;
    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        const fileObj =
          art.file instanceof File
            ? art.file
            : new File([art.file], art.name, { type: art.mimeType });
        handleFileProcess(fileObj);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [artifactParam, handleFileProcess]);

  const handleDownload = (format: TableExportFormat) => {
    if (!result || !result.tables[activeTableIdx]) return;
    const table = result.tables[activeTableIdx];
    const blob = exportTableToBlob(table, format);
    const ext = format === "xlsx" ? "xls" : format;
    const downloadName = `${result.fileName.replace(/\.[^/.]+$/, "")}-table.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendToAi = () => {
    if (!result?.busDocumentId) return;
    router.push(`/ai-workspace?artifact=${result.busDocumentId}`);
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
          <span className="text-text-primary">Tabular Structure Parser</span>
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Understand</Badge>
              <Badge variant="outline">Client Engine</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Tabular Structure Parser
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Extract tables and structured grids from PDFs, text files, and OCR outputs into clean CSV, JSON, Markdown, and Excel spreadsheets.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        {state === "empty" && (
          <div className="rounded-xl border border-dashed border-border-default p-12 text-center bg-surface-raised/40">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary font-mono">Upload Document to Parse Tables</h3>
              <p className="text-xs text-text-muted font-mono">
                Select a PDF, CSV, TSV, TXT, or Markdown document containing tabular data.
              </p>
              <input
                type="file"
                id="table-upload-input"
                className="hidden"
                accept=".pdf,.csv,.tsv,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileProcess(file);
                }}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById("table-upload-input")?.click()}
                className="font-mono text-xs font-bold"
              >
                Choose File
              </Button>
            </div>
          </div>
        )}

        {state === "analyzing" && (
          <div className="rounded-xl border border-border-default bg-surface-base p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mb-4" />
            <p className="text-sm font-mono font-bold text-text-primary">Detecting table boundaries & extracting rows...</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-xl border border-border-danger bg-surface-base p-8 text-center space-y-4">
            <p className="text-sm font-mono text-text-danger font-bold">{error?.message || "Failed to parse table."}</p>
            <Button variant="secondary" onClick={() => setState("empty")} className="font-mono text-xs">
              Try Another File
            </Button>
          </div>
        )}

        {state === "parsed" && result && (
          <div className="space-y-6">
            {/* Table Metrics Bar */}
            <div className="rounded-xl border border-border-default bg-surface-base p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                    {result.fileName}
                  </h3>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    Parsed {result.tables.length} table(s) in {result.durationMs} ms
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["csv", "json", "markdown", "xlsx"] as TableExportFormat[]).map((fmt) => (
                    <Button
                      key={fmt}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(fmt)}
                      className="font-mono text-xs uppercase"
                    >
                      Export {fmt}
                    </Button>
                  ))}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendToAi}
                    className="font-mono text-xs font-bold"
                  >
                    ✨ Open in AI Workspace ➔
                  </Button>
                </div>
              </div>

              {/* Table Data Preview */}
              {result.tables[activeTableIdx] && (
                <div className="mt-6 overflow-x-auto max-h-[500px] border border-border-subtle rounded-lg">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-surface-raised border-b border-border-default text-text-primary">
                        {result.tables[activeTableIdx].headers.map((h, i) => (
                          <th key={i} className="p-3 font-bold border-r border-border-subtle last:border-r-0">
                            {h || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.tables[activeTableIdx].rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="border-b border-border-subtle hover:bg-surface-raised/50 transition-colors text-text-secondary"
                        >
                          {result.tables[activeTableIdx].headers.map((_, cIdx) => (
                            <td key={cIdx} className="p-3 border-r border-border-subtle last:border-r-0">
                              {row[cIdx] !== undefined ? row[cIdx] : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setState("empty")} className="font-mono text-xs">
                  Parse Another Document
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export function TableParser() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-text-muted">Loading Table Parser...</div>}>
      <TableParserInner />
    </Suspense>
  );
}
