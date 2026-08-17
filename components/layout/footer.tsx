import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface-base/50 text-text-secondary transition-colors">
      <Container size="xl" className="py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo size="md" />
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              KALVEX is the privacy-first file and document productivity platform.
              Convert, compress, create, and understand documents with zero server file retention.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-raised px-3 py-1.5 rounded-md border border-border-subtle w-fit">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Zero-knowledge client-first processing</span>
            </div>
          </div>

          {/* Navigation Column: Tools */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Core Capabilities
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  PDF & Office Conversion
                </span>
              </li>
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Document Compression
                </span>
              </li>
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Secure OCR & Extraction
                </span>
              </li>
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Private Document AI
                </span>
              </li>
            </ul>
          </div>

          {/* Navigation Column: Platform */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tools" className="hover:text-text-primary transition-colors">
                  Tools Directory
                </Link>
              </li>
              <li>
                <Link href="/ai-workspace" className="hover:text-text-primary transition-colors">
                  AI Workspace
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-text-primary transition-colors">
                  Workspace Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-text-primary transition-colors">
                  Pricing & Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column: Privacy & Security */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Security & Privacy
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Privacy Architecture
                </span>
              </li>
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Zero Data Retention
                </span>
              </li>
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Client-Side Execution
                </span>
              </li>
              <li>
                <span className="text-text-muted hover:text-text-primary transition-colors cursor-default">
                  Compliance & Standards
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {currentYear} KALVEX. All rights reserved. Built for private productivity.</p>
          <div className="flex items-center gap-6">
            <span>Privacy-First Architecture</span>
            <span>•</span>
            <span>No AI Training on User Files</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
