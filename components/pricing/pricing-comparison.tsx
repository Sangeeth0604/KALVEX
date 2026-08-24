"use client";

import React from "react";
import { COMPARISON_FEATURES } from "./pricing-data";

export function PricingComparison() {
  return (
    <div className="space-y-6 pt-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Compare Plans
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary">
          See what is included in each KALVEX plan.
        </p>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="rounded-2xl border border-border-default bg-surface-base shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-border-default bg-surface-raised/60 text-xs font-mono">
                <th className="py-3.5 px-5 font-bold text-text-primary uppercase tracking-wider">
                  Feature
                </th>
                <th className="py-3.5 px-4 text-center font-bold text-accent uppercase tracking-wider w-24">
                  Free
                </th>
                <th className="py-3.5 px-4 text-center font-bold text-text-primary uppercase tracking-wider w-24 bg-accent/5">
                  Plus
                </th>
                <th className="py-3.5 px-4 text-center font-bold text-text-secondary uppercase tracking-wider w-24">
                  Pro
                </th>
                <th className="py-3.5 px-4 text-center font-bold text-text-secondary uppercase tracking-wider w-24">
                  Team
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono text-xs">
              {COMPARISON_FEATURES.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-surface-raised/40 transition-colors ${
                    idx % 2 === 1 ? "bg-surface-raised/15" : ""
                  }`}
                >
                  <td className="py-3 px-5 text-text-primary font-medium">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.free ? (
                      <span className="text-accent font-bold text-sm" title="Included in Free">✓</span>
                    ) : (
                      <span className="text-text-muted" title="Not included in Free">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center bg-accent/5">
                    {row.plus ? (
                      <span className="text-accent font-bold text-sm" title="Included in Plus">✓</span>
                    ) : (
                      <span className="text-text-muted" title="Not included in Plus">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.pro ? (
                      <span className="text-accent font-bold text-sm" title="Included in Pro">✓</span>
                    ) : (
                      <span className="text-text-muted" title="Not included in Pro">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.team ? (
                      <span className="text-accent font-bold text-sm" title="Included in Team">✓</span>
                    ) : (
                      <span className="text-text-muted" title="Not included in Team">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
