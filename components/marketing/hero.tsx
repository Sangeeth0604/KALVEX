import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  const securityPillars = [
    {
      title: "Convert",
      description: "Convert PDFs, Office docs, images, and data formats with exact structural fidelity.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-accent"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      title: "Compress",
      description: "Shrink document and media file sizes drastically with zero visual compromise.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-accent"
        >
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ),
    },
    {
      title: "Create",
      description: "Generate structured documents, technical sheets, and reports seamlessly.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-accent"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      title: "Understand",
      description: "Extract insights, run private OCR, and parse document intelligence securely.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-accent"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  ];

  const guarantees = [
    "Client-Side First Processing",
    "Zero File Retention",
    "In-Memory Computation",
    "No AI Training on Files",
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Subtle background technical grid line indicator */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(circle_at_50%_0%,var(--accent),transparent_70%)]" />

      <Container size="xl">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Privacy Badge */}
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Badge variant="accent" size="md" dot>
              Privacy-First File & Document Productivity
            </Badge>
          </div>

          {/* Main Core Promise Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1] mb-6">
            Convert. Compress.
            <br />
            Create. <span className="text-accent">Understand.</span>
          </h1>

          {/* Subheading / Value Proposition */}
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed mb-10 font-normal">
            The technical document workspace engineered for uncompromising privacy. Process,
            transform, and analyze your critical files without data retention or third-party exposure.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
            <Link href="/tools" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-semibold px-8"
                rightIcon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                }
              >
                Explore File Tools
              </Button>
            </Link>

            <Link href="/ai-workspace" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto px-6"
              >
                AI Workspace Preview
              </Button>
            </Link>
          </div>

          {/* Privacy Guarantees Row */}
          <div className="w-full pt-8 border-t border-border-subtle grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-text-muted">
            {guarantees.map((item) => (
              <div
                key={item}
                className="flex items-center justify-center gap-2 p-2 rounded-md bg-surface-raised/40 border border-border-subtle"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {securityPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="relative group p-6 rounded-xl bg-surface-base border border-border-default hover:border-border-accent transition-all duration-200 shadow-card hover:shadow-[0_4px_20px_-4px_rgba(0,245,155,0.15)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-surface-raised border border-border-subtle text-accent group-hover:border-border-accent transition-colors">
                  {pillar.icon}
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  Module
                </span>
              </div>

              <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-1.5">
                {pillar.title}
                <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </h2>

              <p className="text-sm text-text-secondary leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
