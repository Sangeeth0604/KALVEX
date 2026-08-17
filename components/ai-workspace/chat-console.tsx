"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChatMessage,
  WorkspaceTab,
  Citation,
} from "@/lib/ai-workspace/types";
import {
  SAMPLE_EXTRACTED_FIELDS,
  SUGGESTED_PROMPTS,
} from "@/lib/ai-workspace/mock-data";

interface ChatConsoleProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSelectCitation: (citation: Citation) => void;
}

export function ChatConsole({
  messages,
  onSendMessage,
  onSelectCitation,
}: ChatConsoleProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal("");
  };

  const handleSelectPrompt = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border-default bg-surface-base shadow-card overflow-hidden">
      {/* Console Tab Selector */}
      <div className="p-2 bg-surface-raised border-b border-border-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              activeTab === "chat"
                ? "bg-surface-base text-accent font-semibold border border-border-default shadow-subtle"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            Document Q&A
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("extraction")}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              activeTab === "extraction"
                ? "bg-surface-base text-accent font-semibold border border-border-default shadow-subtle"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            Structured Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clauses")}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              activeTab === "clauses"
                ? "bg-surface-base text-accent font-semibold border border-border-default shadow-subtle"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            Key Obligations
          </button>
        </div>

        <span className="text-[11px] font-mono text-accent hidden sm:inline-block pr-2">
          ● Verified Grounding Active
        </span>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 flex flex-col justify-between p-4 max-h-[640px] overflow-hidden">
        {activeTab === "chat" && (
          <>
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-text-muted">
                    <span>{msg.sender === "user" ? "You" : "KALVEX Intelligence"}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl text-xs max-w-xl leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-surface-raised border border-border-default text-text-primary"
                        : "bg-surface-base border border-border-default text-text-primary shadow-subtle"
                    }`}
                  >
                    <p className="font-sans mb-2">{msg.text}</p>

                    {/* Citations Row */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border-subtle flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-text-muted">
                          Source Grounding:
                        </span>
                        {msg.citations.map((cit) => (
                          <button
                            key={cit.id}
                            type="button"
                            onClick={() => onSelectCitation(cit)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-accent bg-accent-subtle hover:bg-accent-subtle-hover px-2 py-0.5 rounded border border-border-accent-subtle cursor-pointer transition-colors"
                            title={cit.excerpt}
                          >
                            <span>📍</span>
                            <span>Page {cit.page}, {cit.clause}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Prompts */}
            <div className="pt-2 pb-3 border-t border-border-subtle">
              <span className="text-[10px] font-mono uppercase text-text-muted block mb-1.5">
                Suggested Inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPrompt(prompt)}
                    className="text-[11px] font-sans text-text-secondary hover:text-text-primary bg-surface-raised hover:bg-surface-hover px-2.5 py-1 rounded-md border border-border-subtle transition-colors cursor-pointer text-left truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about clauses, liabilities, or data retention..."
                className="flex-1 px-3.5 py-2 bg-surface-base border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors font-sans"
              />
              <Button variant="primary" size="sm" type="submit">
                Query
              </Button>
            </form>
          </>
        )}

        {activeTab === "extraction" && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="p-3 bg-surface-raised rounded-lg border border-border-subtle text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-text-primary">
                  Extracted JSON Schema (Contract Structure)
                </span>
                <span className="text-[10px] font-mono text-accent">Validated Schema</span>
              </div>
              <pre className="p-3 bg-surface-base rounded border border-border-default font-mono text-[11px] text-text-primary overflow-x-auto">
{`{
  "contract_type": "Enterprise Master Services Agreement",
  "document_id": "doc-enterprise-agreement",
  "data_retention": {
    "purge_window_days": 30,
    "stateless_processing": true,
    "model_training_permitted": false,
    "citation": "Page 7, Clause 4.2"
  },
  "liability": {
    "aggregate_cap": "12_months_paid_fees",
    "uncapped_exceptions": [
      "IP infringement (Section 2.4)",
      "Gross negligence"
    ],
    "citation": "Page 9, Clause 6.1"
  },
  "security": {
    "transit_encryption": "TLS 1.3",
    "buffer_cleared_on_session_end": true,
    "citation": "Page 12, Clause 8.3"
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "clauses" && (
          <div className="flex-1 overflow-y-auto space-y-2.5">
            {SAMPLE_EXTRACTED_FIELDS.map((field) => (
              <div
                key={field.key}
                className="p-3 rounded-lg bg-surface-base border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-border-accent-subtle">
                      {field.category}
                    </span>
                    <h4 className="text-xs font-bold text-text-primary">
                      {field.label}
                    </h4>
                  </div>
                  <p className="text-xs text-text-secondary">{field.value}</p>
                </div>

                <span className="text-[11px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded border border-border-subtle whitespace-nowrap self-start sm:self-center">
                  {field.citation}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
