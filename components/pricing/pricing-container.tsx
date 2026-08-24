"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { PRICING_PLANS } from "./pricing-data";
import { PricingPlanCard } from "./pricing-plan-card";
import { PricingComparison } from "./pricing-comparison";
import { ComingSoonModal } from "./coming-soon-modal";

export function PricingContainer() {
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState<string | undefined>(undefined);

  const handleOpenComingSoon = (planName: string) => {
    setSelectedPlanName(planName);
    setComingSoonModalOpen(true);
  };

  const handleCloseComingSoon = () => {
    setComingSoonModalOpen(false);
    setSelectedPlanName(undefined);
  };

  return (
    <div className="py-12 sm:py-16 pb-28">
      <Container size="xl" className="space-y-12 sm:space-y-16">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="accent" size="sm" dot>
              Transparent Pricing
            </Badge>
            <span className="text-xs font-mono text-text-muted bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
              Public Beta
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary">
            Simple pricing. Private processing.
          </h1>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Start free during the KALVEX Public Beta. Upgrade when you need higher limits, advanced automation, or team workflows.
          </p>

          {/* Small Public Beta Notice */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-semibold">
              <span>●</span>
              <span>Public Beta: Core document processing is currently free for everyone.</span>
            </div>
          </div>
        </div>

        {/* 4-Tier Pricing Grid: 4-col desktop, 2-col tablet, 1-col mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              onOpenComingSoon={handleOpenComingSoon}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <PricingComparison />

        {/* Privacy Section */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl bg-surface-raised/50 border border-border-subtle flex flex-col sm:flex-row items-start gap-4 sm:gap-6 shadow-card">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl shrink-0">
            🔒
          </div>
          <div className="space-y-1.5 text-xs font-mono text-text-secondary leading-relaxed">
            <h3 className="text-sm font-bold font-sans text-text-primary">
              Your files stay on your device.
            </h3>
            <p className="text-text-muted">
              KALVEX is designed around client-first processing. Core document operations execute inside your browser whenever possible, without server-side document storage.
            </p>
          </div>
        </div>

        {/* Reusable Coming Soon Modal */}
        <ComingSoonModal
          isOpen={comingSoonModalOpen}
          onClose={handleCloseComingSoon}
          planName={selectedPlanName}
        />
      </Container>
    </div>
  );
}
