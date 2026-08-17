import React from "react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export function PrivacyArchitecture() {
  const comparisonRows = [
    {
      parameter: "Execution Engine",
      standard: "Remote server upload required for all tasks",
      kalvex: "Client-side WebAssembly prioritized first",
      highlight: true,
    },
    {
      parameter: "File Retention Policy",
      standard: "Retained on disk for hours or days",
      kalvex: "Zero persistent file retention on servers",
      highlight: true,
    },
    {
      parameter: "Session Lifecycle",
      standard: "Stored in persistent databases",
      kalvex: "Ephemeral in-memory task teardown",
      highlight: true,
    },
    {
      parameter: "Data Minimization",
      standard: "Full document uploaded by default",
      kalvex: "Local browser processing whenever supported",
      highlight: true,
    },
  ];

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-surface-base/30">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
          {/* Left Column: Narrative & Principles (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <Badge variant="accent" size="md" dot className="mb-4">
              Privacy-First Processing Architecture
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-4">
              Process files locally whenever possible.
            </h2>

            <p className="text-base text-text-secondary leading-relaxed mb-8">
              Traditional cloud utilities upload every document to remote servers regardless of task
              complexity. KALVEX emphasizes in-browser execution and zero-retention memory pipelines,
              reducing unnecessary data exposure.
            </p>

            <div className="w-full space-y-4">
              <div className="p-4 rounded-lg bg-surface-base border border-border-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Client-Side First Execution
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Supported format transformations, image compressions, and metadata inspections run
                  directly inside browser WebAssembly engines without network uploads.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-base border border-border-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Zero-Retention Architecture
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  When server processing is required, files are handled by stateless, ephemeral
                  workers and purged immediately upon completion.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-base border border-border-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Controlled Session Isolation
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Document analysis workflows operate within isolated session boundaries without
                  long-term file caching.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Technical Comparison Ledger (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
              {/* Ledger Header */}
              <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface-raised flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                    Security & Data Flow Spec
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Architectural comparison of standard file tools vs. KALVEX
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[11px] font-mono text-accent bg-accent-subtle px-2.5 py-1 rounded border border-border-accent-subtle w-fit">
                  <span>Zero Server Retention</span>
                </div>
              </div>

              {/* Ledger Table / List */}
              <div className="divide-y divide-border-subtle">
                {comparisonRows.map((row, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center hover:bg-surface-hover/50 transition-colors"
                  >
                    <div className="sm:col-span-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-primary font-mono block">
                        {row.parameter}
                      </span>
                    </div>

                    <div className="sm:col-span-4 text-xs text-text-muted">
                      <span className="sm:hidden font-mono uppercase text-[10px] text-text-muted block mb-0.5">
                        Standard Tools:
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-error font-mono">✕</span>
                        <span>{row.standard}</span>
                      </span>
                    </div>

                    <div className="sm:col-span-4 text-xs text-text-primary font-medium">
                      <span className="sm:hidden font-mono uppercase text-[10px] text-accent block mb-0.5">
                        KALVEX:
                      </span>
                      <span className="flex items-center gap-1.5 text-accent">
                        <span className="font-mono">✓</span>
                        <span className="text-text-primary">{row.kalvex}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ledger Footer Status */}
              <div className="p-3.5 bg-surface-raised/60 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Stateless Memory Pipeline Active
                </span>
                <span>Specification v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
