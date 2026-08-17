import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  const auditPoints = [
    "Client-Side First Engine",
    "No Account Required",
    "Zero Persistent File Retention",
  ];

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-surface-base/30">
      <Container size="xl">
        <div className="relative rounded-2xl border border-border-default bg-surface-base p-8 sm:p-12 md:p-16 text-center max-w-4xl mx-auto shadow-card overflow-hidden">
          {/* Subtle accent corner indicators */}
          <div className="absolute top-0 left-0 h-1 w-12 bg-accent" />
          <div className="absolute top-0 right-0 h-1 w-12 bg-accent" />

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-4">
            Ready for secure, zero-retention document productivity?
          </h2>

          <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed mb-8">
            Process files locally whenever possible. Convert, compress, and analyze your critical
            documents without persistent server storage.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/tools" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 font-semibold">
                Open Tools Directory
              </Button>
            </Link>

            <Link href="/ai-workspace" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6">
                AI Workspace Preview
              </Button>
            </Link>
          </div>

          {/* Trust & Privacy Audit Strip */}
          <div className="pt-6 border-t border-border-subtle flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono text-text-muted">
            {auditPoints.map((point) => (
              <div key={point} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
