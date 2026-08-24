"use client";

import React, { useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
}

export function ComingSoonModal({ isOpen, onClose, planName }: ComingSoonModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scrolling while modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-surface-base border border-border-default rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative animate-in zoom-in-95 duration-150">
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg border border-transparent hover:border-border-subtle transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon & Heading */}
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/10 border border-accent/30 text-accent text-2xl mx-auto">
          ✨
        </div>

        <div className="space-y-2">
          <h3 id="modal-title" className="text-xl font-bold tracking-tight text-text-primary">
            Paid plans are coming soon.
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {planName ? (
              <span className="block font-mono text-accent font-semibold mb-1">
                {planName} Plan Preview
              </span>
            ) : null}
            You&apos;re currently using KALVEX Public Beta, where the core platform is free.
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            We&apos;re preparing paid plans for higher limits, advanced automation, and team capabilities.
          </p>
        </div>

        {/* Informational Callout */}
        <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle text-[11px] font-mono text-text-secondary text-left space-y-1">
          <div className="flex items-center gap-1.5 text-accent font-bold">
            <span>✓</span>
            <span>Zero Payment Required</span>
          </div>
          <p className="text-text-muted leading-normal">
            All 12 core tools and client-side processing remain completely free and unrestricted during our public beta.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="w-full font-mono text-xs font-bold cursor-pointer px-6 shadow-subtle"
            >
              Continue with Free
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
