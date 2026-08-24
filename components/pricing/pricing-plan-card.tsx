"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PricingPlan } from "./pricing-data";

interface PricingPlanCardProps {
  plan: PricingPlan;
  onOpenComingSoon: (planName: string) => void;
}

export function PricingPlanCard({ plan, onOpenComingSoon }: PricingPlanCardProps) {
  // Determine card container styling
  const getCardClasses = () => {
    if (plan.isPopular) {
      // Plus Plan: Strongest visual emphasis / primary upgrade path
      return "border-2 border-accent bg-surface-base shadow-lg shadow-accent/5 ring-1 ring-accent relative";
    }
    if (plan.isCurrent) {
      // Free Plan: Active plan with subtle electric-green border
      return "border-2 border-accent/50 bg-surface-base shadow-card relative";
    }
    // Pro & Team Plans: Sleek technical appearance
    return "border border-border-default bg-surface-base/75 shadow-card hover:border-border-strong transition-colors relative";
  };

  // Determine badge styling
  const getBadgeClasses = () => {
    if (plan.badgeVariant === "popular") {
      return "bg-accent text-black font-extrabold shadow-subtle";
    }
    if (plan.badgeVariant === "accent") {
      return "bg-accent/15 text-accent border border-accent/30 font-bold";
    }
    return "bg-surface-raised text-text-muted border border-border-subtle font-semibold";
  };

  return (
    <div className={`p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all ${getCardClasses()}`}>
      {/* Top Section: Badge & Header */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-bold tracking-tight text-text-primary">
            {plan.name}
          </h3>
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${getBadgeClasses()}`}>
            {plan.badge}
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed min-h-[36px]">
          {plan.description}
        </p>

        {/* Price & Billing Interval */}
        <div className="flex items-baseline gap-1.5 pb-2 border-b border-border-subtle">
          <span className="text-4xl font-extrabold font-mono text-text-primary">
            {plan.price}
          </span>
          <span className="text-xs font-mono text-text-muted">
            / {plan.period}
          </span>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2.5 pt-1 text-xs font-mono">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-text-secondary">
              <span className="text-accent font-bold mt-0.5 shrink-0">✓</span>
              <span className="leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-8">
        {plan.isCurrent ? (
          <Link href="/dashboard" className="block w-full">
            <Button
              variant="primary"
              size="md"
              className="w-full font-mono text-xs font-bold cursor-pointer shadow-subtle"
            >
              {plan.ctaText} ➔
            </Button>
          </Link>
        ) : plan.isPopular ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => onOpenComingSoon(plan.name)}
            className="w-full font-mono text-xs font-bold cursor-pointer shadow-subtle"
          >
            {plan.ctaText}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="md"
            onClick={() => onOpenComingSoon(plan.name)}
            className="w-full font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary hover:border-border-strong"
          >
            {plan.ctaText}
          </Button>
        )}
      </div>
    </div>
  );
}
