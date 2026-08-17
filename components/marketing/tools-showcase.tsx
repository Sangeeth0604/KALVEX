"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TOOLS_DATA, getCategoryList } from "@/lib/tools/tool-data";
import { ToolCategory } from "@/lib/tools/types";

export function ToolsShowcase() {
  const [activeTab, setActiveTab] = useState<"all" | ToolCategory>("all");

  const categories = useMemo(() => getCategoryList(), []);

  const filteredTools = useMemo(() => {
    return activeTab === "all"
      ? TOOLS_DATA
      : TOOLS_DATA.filter((tool) => tool.category === activeTab);
  }, [activeTab]);

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-background">
      <Container size="xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <Badge variant="accent" size="md" dot className="mb-4">
              File Engine Suite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-3">
              Engineered for high-volume, precise document operations.
            </h2>
            <p className="text-sm sm:text-base text-text-secondary">
              A representative index of KALVEX tools designed for local-first and zero-retention processing.
            </p>
          </div>

          <Link href="/tools">
            <Button variant="outline" size="md" className="hidden sm:inline-flex">
              Explore Tools Directory →
            </Button>
          </Link>
        </div>

        {/* Category Tabs Workbench */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-border-subtle scrollbar-none">
          {categories.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-surface-raised text-accent border border-border-accent shadow-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-accent-subtle text-accent" : "bg-surface-raised text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Directory Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const isAvailable = tool.status === "available";
            const content = (
              <div
                className={`p-5 rounded-xl bg-surface-base border transition-all duration-150 flex flex-col justify-between h-full ${
                  isAvailable
                    ? "border-border-default hover:border-accent hover:shadow-[0_4px_20px_-4px_rgba(0,245,155,0.2)] group"
                    : "border-border-default hover:border-border-accent/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
                      {tool.categoryLabel}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        isAvailable
                          ? "text-accent bg-accent-subtle border-border-accent-subtle font-semibold"
                          : "text-text-muted bg-surface-raised border-border-subtle"
                      }`}
                    >
                      {isAvailable ? "● Available" : tool.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary mb-2 flex items-center justify-between">
                    <span>{tool.name}</span>
                    {isAvailable && (
                      <span className="text-accent text-sm transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-subtle/80 flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-text-muted">In:</span>
                    <span className="text-text-primary truncate font-medium">
                      {tool.inputFormats.join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-muted">Out:</span>
                    <span className="text-accent font-medium">{tool.outputFormat}</span>
                  </div>
                </div>
              </div>
            );

            if (isAvailable) {
              return (
                <Link key={tool.id} href={`/tools/${tool.slug}`} className="block h-full outline-none">
                  {content}
                </Link>
              );
            }

            return <div key={tool.id}>{content}</div>;
          })}
        </div>

        {/* Bottom Mobile Action */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/tools" className="w-full block">
            <Button variant="outline" size="md" className="w-full">
              Explore Tools Directory →
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
