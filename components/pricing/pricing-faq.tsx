"use client";

import React, { useState } from "react";
import { PRICING_FAQS } from "./pricing-data";

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-text-secondary">
          Common questions about KALVEX&apos;s free, ad-supported model and privacy architecture.
        </p>
      </div>

      {/* FAQ Items Accordion/Cards */}
      <div className="max-w-3xl mx-auto space-y-3">
        {PRICING_FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-border-default bg-surface-base overflow-hidden transition-colors shadow-card"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                aria-expanded={isOpen}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-raised/40 transition-colors"
              >
                <span className="text-sm sm:text-base font-semibold text-text-primary">
                  {faq.question}
                </span>
                <span
                  className={`text-accent font-mono text-lg transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-subtle/50 animate-in fade-in-50 duration-150">
                  <p className="mt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
