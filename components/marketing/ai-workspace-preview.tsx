import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AiWorkspacePreview() {
  const capabilities = [
    {
      title: "Verified Page-Level Citations",
      description: "Every answer directly references specific pages, clauses, and coordinate bounding boxes.",
    },
    {
      title: "Session-Scoped Processing",
      description: "Document context and embeddings remain bound exclusively to your active session.",
    },
    {
      title: "Structured Schema Extraction",
      description: "Transform unstructured documents and agreements into validated JSON schemas.",
    },
    {
      title: "Zero Document Retention Policy",
      description: "AI interaction endpoints are configured without permanent file caching on backend disks.",
    },
  ];

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-surface-base/40">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Narrative & Capabilities (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <Badge variant="accent" size="md" dot className="mb-4">
              Controlled Document AI
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-4">
              Synthesize, query, and extract insights with privacy controls.
            </h2>

            <p className="text-base text-text-secondary leading-relaxed mb-8">
              Analyze multi-page documents, contracts, and technical sheets with strict session boundaries
              and transparent source verification.
            </p>

            <div className="space-y-4 w-full mb-8">
              {capabilities.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded bg-accent-subtle border border-border-accent-subtle flex items-center justify-center text-accent text-xs font-mono shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/ai-workspace">
              <Button variant="primary" size="md">
                Launch AI Workspace Preview →
              </Button>
            </Link>
          </div>

          {/* Right Column: Simulated Document Intelligence Terminal (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
              {/* Terminal Titlebar */}
              <div className="p-3.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                  </div>
                  <span className="text-xs font-mono text-text-muted ml-2">
                    kalvex-ai // session-preview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[11px] font-mono text-accent">Active Session</span>
                </div>
              </div>

              {/* Active File Bar */}
              <div className="px-4 py-2.5 bg-surface-base border-b border-border-subtle flex items-center justify-between text-xs font-mono text-text-muted">
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="text-accent">📄</span>
                  <span>confidential_service_agreement.pdf</span>
                  <span className="text-text-muted">(14 Pages)</span>
                </div>
                <span className="text-[11px] text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                  Isolated RAM
                </span>
              </div>

              {/* Query & Extraction Content */}
              <div className="p-5 space-y-4 font-mono text-xs">
                {/* User Prompt */}
                <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-text-primary">
                  <span className="text-accent mr-2 font-bold">&gt;</span>
                  <span>Extract termination liability and data retention provisions in Section 4.</span>
                </div>

                {/* AI Response Output */}
                <div className="p-4 rounded-lg bg-surface-base border border-border-default space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-text-muted border-b border-border-subtle pb-2">
                    <span className="text-accent font-semibold flex items-center gap-1">
                      <span>✓</span> Verified Source Grounding
                    </span>
                    <span className="bg-accent-subtle text-accent px-2 py-0.5 rounded border border-border-accent-subtle">
                      Page 7, Clause 4.2
                    </span>
                  </div>

                  <p className="text-text-secondary leading-relaxed font-sans text-xs">
                    Under Section 4.2, all proprietary files must be purged within <strong className="text-text-primary">30 days</strong> following written termination notice. Total aggregate liability is capped at 12 months of paid service fees.
                  </p>

                  {/* Extracted Schema Block */}
                  <div className="p-2.5 rounded bg-surface-raised border border-border-subtle text-[11px] text-text-secondary overflow-x-auto">
                    <span className="text-text-muted block mb-1 font-mono">{"// Structured JSON output:"}</span>
                    <pre className="text-text-primary font-mono text-[11px] leading-tight">
{`{
  "section": "4.2",
  "retention_obligation_days": 30,
  "liability_cap": "12_months_service_fees",
  "data_purging_required": true
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Terminal Bottom Audit */}
              <div className="px-4 py-2.5 bg-surface-raised/60 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>Session Status: Isolated Memory</span>
                <span className="text-accent">0 Bytes Stored on Disk</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
