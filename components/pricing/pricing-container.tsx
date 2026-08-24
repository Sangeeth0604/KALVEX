"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/ad-slot";
import { PricingCapabilities } from "./pricing-capabilities";
import { PricingFaq } from "./pricing-faq";

export function PricingContainer() {
  const freeFeatures = [
    "All 12 core document tools",
    "Client-side document processing where supported",
    "Image compression",
    "PDF processing and optimization",
    "OCR",
    "PDF to Office conversion",
    "Document sanitization",
    "Table extraction",
    "Document comparison",
    "Custom workflows",
    "Operation history",
    "AI Workspace access when configured",
  ];

  return (
    <div className="py-8 sm:py-12 md:py-16 pb-20 sm:pb-28 overflow-x-hidden">
      <Container size="xl" className="space-y-12 sm:space-y-16 md:space-y-20">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="accent" size="sm" dot>
              Transparent Pricing
            </Badge>
            <span className="text-[11px] sm:text-xs font-mono text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20 font-semibold">
              ● Free Forever • Ad Supported
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary">
            Free. Private. Built for Everyone.
          </h1>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Use KALVEX&apos;s document tools without subscriptions or paywalls. KALVEX is supported by advertising so the core platform can remain free.
          </p>
        </div>

        {/* Primary Free Plan Card */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="p-6 sm:p-8 md:p-10 rounded-2xl border-2 border-accent bg-surface-base shadow-xl shadow-accent/5 ring-1 ring-accent/40 space-y-6 relative">
            {/* Plan Header & Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  KALVEX Free
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  Full access to KALVEX&apos;s core document productivity tools with privacy-first, browser-based processing.
                </p>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-black font-extrabold shadow-subtle shrink-0 self-start sm:self-auto">
                FREE FOR EVERYONE
              </span>
            </div>

            {/* Price Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-text-primary">
                $0
              </span>
              <span className="text-xs sm:text-sm font-mono text-text-muted uppercase tracking-wider">
                / Forever
              </span>
            </div>

            {/* Features Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm font-mono">
              {freeFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-text-secondary">
                  <span className="text-accent font-bold mt-0.5 shrink-0 text-sm">✓</span>
                  <span className="leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-6 border-t border-border-subtle">
              <Link href="/dashboard" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-12 font-mono text-xs sm:text-sm font-bold cursor-pointer shadow-subtle"
                >
                  Start Using KALVEX ➔
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Ad-Supported Model Explanation Section */}
        <div className="max-w-3xl mx-auto w-full p-6 sm:p-8 rounded-2xl border border-border-default bg-surface-base shadow-card space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <span className="text-xl">💡</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                How KALVEX stays free
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              KALVEX is supported by advertising instead of subscriptions. This allows us to keep the core document tools available to everyone without charging users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-bold">
                <span>✓</span>
                <span>Core Tools Remain Free</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                All 12 document tools and workflow engines are available to every user without paywalls.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-bold">
                <span>✓</span>
                <span>No Subscriptions Required</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                No credit cards, recurring billing, or membership accounts needed to process files.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-bold">
                <span>✓</span>
                <span>Sustainable Infrastructure</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                Non-intrusive sponsor placements offset engineering and high-availability hosting costs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-bold">
                <span>✓</span>
                <span>Separated from Workflows</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                Advertisements never interfere with upload, processing, results, or download controls.
              </p>
            </div>
          </div>

          {/* Non-intrusive Sponsor Slot Placeholder */}
          <div className="pt-2">
            <AdSlot slotId="pricing-model-ad" format="horizontal" />
          </div>
        </div>

        {/* Capabilities Grid: 12 Tools + Workspace */}
        <PricingCapabilities />

        {/* FAQ Section */}
        <PricingFaq />

        {/* Privacy Section */}
        <div className="max-w-4xl mx-auto p-5 sm:p-6 lg:p-8 rounded-2xl bg-surface-raised/50 border border-border-subtle flex flex-col sm:flex-row items-start gap-3.5 sm:gap-6 shadow-card">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl shrink-0">
            🔒
          </div>
          <div className="space-y-2 text-xs font-mono text-text-secondary leading-relaxed">
            <h3 className="text-sm sm:text-base font-bold font-sans text-text-primary">
              Your files stay on your device.
            </h3>
            <p className="text-text-muted">
              Core document processing is designed to run in your browser whenever possible. Uploaded document contents are not sent to KALVEX servers for core client-side processing.
            </p>
            <p className="text-text-muted/80 text-[11px]">
              Advertising services may process information required to display and measure advertisements. See the Privacy Policy for details.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
