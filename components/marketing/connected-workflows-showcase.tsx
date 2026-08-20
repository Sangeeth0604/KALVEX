import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ConnectedWorkflowsShowcase() {
  const pipelines = [
    {
      title: "Scanned Document Intelligence",
      tagline: "Scan → OCR → AI Understanding",
      description:
        "Extract text from image or PDF scans via client-side WASM OCR, then instantly generate structured entity tables and summaries.",
      steps: ["Local File Drop", "WASM OCR", "AI Intelligence", "Structured Result"],
      targetUrl: "/workflows?template=wf-template-scanned-contract",
      badge: "Real-World Pipeline",
    },
    {
      title: "PDF Stream Optimization & Briefing",
      tagline: "PDF → Optimize → Summarize",
      description:
        "Shrink large PDF structures in-memory via stream deduplication, then hand the document to AI Workspace for instant summarization.",
      steps: ["PDF Ingestion", "Stream Optimizer", "AI Summarize", "Optimized Output"],
      targetUrl: "/workflows?template=wf-template-pdf-optimize-summarize",
      badge: "Fast Track",
    },
    {
      title: "Cross-Tool Media Transcoding",
      tagline: "Image → Convert → Compress",
      description:
        "Convert legacy formats into modern WebP formats in browser Canvas, then run lossless Huffman compression without re-uploading.",
      steps: ["Image Drop", "Format Converter", "Lossless Compressor", "Clean WebP"],
      targetUrl: "/workflows?template=wf-template-image-convert-compress",
      badge: "Lossless Speed",
    },
  ];

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-surface-base/50">
      <Container size="xl">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <Badge variant="accent" size="md" dot className="mb-4">
            Connected Document Flow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-3">
            Work with documents from start to finish.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Move seamlessly from raw files to structured understanding. Pass results between tools in browser memory or run automated multi-step pipelines.
          </p>
        </div>

        {/* 3 Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {pipelines.map((p) => (
            <div
              key={p.title}
              className="flex flex-col justify-between p-6 rounded-xl bg-surface-base border border-border-default hover:border-border-accent/60 transition-all shadow-card group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle font-semibold">
                    {p.badge}
                  </span>
                  <span className="text-xs font-mono text-text-muted">In-Memory Handoff</span>
                </div>

                <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors mb-1">
                  {p.title}
                </h3>
                <div className="text-xs font-mono font-semibold text-text-muted mb-3">
                  {p.tagline}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                  {p.description}
                </p>
              </div>

              <div>
                {/* Step Badges Sequence */}
                <div className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle mb-4">
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mb-1.5 uppercase font-bold">
                    <span>Sequence Flow</span>
                    <span className="text-accent">100% RAM</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.steps.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="text-[11px] font-mono bg-surface-base text-text-primary px-2 py-0.5 rounded border border-border-subtle">
                          {step}
                        </span>
                        {idx < p.steps.length - 1 && (
                          <span className="text-text-muted text-[10px]">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <Link href={p.targetUrl} className="block">
                  <Button variant="outline" size="sm" className="w-full font-mono text-xs font-bold group-hover:border-border-accent">
                    Run This Workflow ➔
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Discovery Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 text-center">
          <Link href="/workflows">
            <Button variant="primary" size="md" className="font-mono text-xs font-bold shadow-subtle">
              Explore All Saved Workflows ➔
            </Button>
          </Link>
          <Link href="/ai-workspace">
            <Button variant="secondary" size="md" className="font-mono text-xs text-text-secondary">
              Open AI Document Workspace
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
