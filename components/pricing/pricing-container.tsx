"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PricingContainer() {
  const [showBetaNoticeModal, setShowBetaNoticeModal] = useState(false);

  return (
    <div className="py-12 pb-28">
      <Container size="xl" className="space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2">
            <Badge variant="accent" size="sm" dot>
              Transparent Pricing
            </Badge>
            <span className="text-xs font-mono text-text-muted bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
              Public Beta
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary">
            Privacy-First Document Productivity
          </h1>
          <p className="text-base text-text-secondary leading-relaxed">
            All core document engines execute in your browser with zero file retention. Free for everyone during our Public Beta.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan 1: Free Community Tier (Current) */}
          <div className="p-8 rounded-2xl border-2 border-accent bg-surface-base shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent/15 text-accent border border-accent/30">
                ACTIVE PLAN
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Free Community Plan</h3>
                <p className="text-xs text-text-secondary mt-1">
                  100% private in-browser document processing for individuals and professionals.
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono text-text-primary">$0</span>
                <span className="text-xs font-mono text-text-muted">/ forever</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-border-subtle text-xs font-mono text-text-secondary">
                <div className="flex items-center gap-2.5">
                  <span className="text-accent font-bold">✓</span>
                  <span>All 12 Core Document Engines</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent font-bold">✓</span>
                  <span>100% Client-Side In-Memory Execution</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent font-bold">✓</span>
                  <span>Zero Server File Retention Policy</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent font-bold">✓</span>
                  <span>Offline WASM OCR & Tabular Parsing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent font-bold">✓</span>
                  <span>Custom Automated Workflows & History</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent font-bold">✓</span>
                  <span>AI Document Reasoning (BYOK / Proxy)</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/tools">
                <Button variant="primary" size="lg" className="w-full font-mono text-xs font-bold cursor-pointer shadow-subtle">
                  Start Using KALVEX Free ➔
                </Button>
              </Link>
            </div>
          </div>

          {/* Plan 2: Pro & Team Tier (Future) */}
          <div className="p-8 rounded-2xl border border-border-default bg-surface-base/60 shadow-card flex flex-col justify-between relative">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-raised text-text-muted border border-border-subtle">
                COMING SOON
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Pro & Team Workspace</h3>
                <p className="text-xs text-text-secondary mt-1">
                  High-throughput automated batch processing and team document workspaces.
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono text-text-primary">$19</span>
                <span className="text-xs font-mono text-text-muted">/ month (est.)</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-border-subtle text-xs font-mono text-text-secondary">
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary font-bold">✓</span>
                  <span>Everything in Free Community Plan</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary font-bold">✓</span>
                  <span>Batch Processing (1,000+ Files Concurrently)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary font-bold">✓</span>
                  <span>Cloud Edge Worker Acceleration</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary font-bold">✓</span>
                  <span>Shared Team Workflow Templates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary font-bold">✓</span>
                  <span>Advanced Privacy Compliance Audits</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary font-bold">✓</span>
                  <span>Dedicated Priority Support</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowBetaNoticeModal(true)}
                className="w-full font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary"
              >
                Upgrade to Pro (Beta Info)
              </Button>
            </div>
          </div>
        </div>

        {/* Transparency Alert Box */}
        <div className="max-w-4xl mx-auto p-6 rounded-xl bg-surface-raised/50 border border-border-subtle flex items-start gap-4">
          <span className="text-2xl">🔒</span>
          <div className="space-y-1 text-xs font-mono text-text-secondary leading-relaxed">
            <h4 className="font-bold text-text-primary">Our Zero-Knowledge Privacy Guarantee</h4>
            <p>
              Unlike traditional SaaS document converters that upload your confidential PDFs and images to remote servers, KALVEX runs all conversions and compressions directly within your browser’s WebAssembly and JavaScript sandbox. Your data never leaves your device.
            </p>
          </div>
        </div>

        {/* Modal: Beta Notice */}
        {showBetaNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-surface-base border border-border-default rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-center">
              <span className="text-4xl block">✨</span>
              <h3 className="text-lg font-bold text-text-primary">Public Beta Notice</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Billing infrastructure is intentionally not enabled. You already have <strong>100% full access</strong> to all 12 tools, custom workflows, OCR, and AI features on the Free Public Beta.
              </p>
              <div className="pt-2 flex justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowBetaNoticeModal(false)}
                  className="font-mono text-xs font-bold cursor-pointer px-6"
                >
                  Got It, Continue Free ➔
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
