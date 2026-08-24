"use client";

import React from "react";
import Link from "next/link";
import { CORE_DOCUMENT_TOOLS, WORKSPACE_CAPABILITIES } from "./pricing-data";

export function PricingCapabilities() {
  return (
    <div className="space-y-10 pt-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Everything you need, free.
        </h2>
        <p className="text-sm text-text-secondary">
          Full access to all 12 core document engines and productivity workspace capabilities.
        </p>
      </div>

      {/* Group 1: 12 Core Document Tools */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <span className="text-accent font-bold font-mono text-xs uppercase tracking-wider">
            Document Tools (12 Core Engines)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_DOCUMENT_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="p-4 rounded-xl border border-border-default bg-surface-base hover:border-border-strong hover:bg-surface-raised/40 transition-all flex flex-col justify-between group shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-bold text-sm">✓</span>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                      {tool.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                    {tool.category}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed pl-5">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 pl-5 flex items-center text-[11px] font-mono text-accent opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                Open Engine ➔
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Group 2: Workspace Capabilities */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <span className="text-accent font-bold font-mono text-xs uppercase tracking-wider">
            Workspace Capabilities
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKSPACE_CAPABILITIES.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="p-4 rounded-xl border border-border-default bg-surface-base hover:border-border-strong hover:bg-surface-raised/40 transition-all flex flex-col justify-between group shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-bold text-sm">✓</span>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                      {item.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed pl-5">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 pl-5 flex items-center text-[11px] font-mono text-accent opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                Launch View ➔
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
