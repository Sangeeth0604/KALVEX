"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/container";
import { WorkspaceHeader } from "./workspace-header";
import { DocumentViewer } from "./document-viewer";
import { ChatConsole } from "./chat-console";
import {
  SAMPLE_DOCUMENT,
  INITIAL_CHAT_MESSAGES,
} from "@/lib/ai-workspace/mock-data";
import { ChatMessage, Citation } from "@/lib/ai-workspace/types";

export function AiWorkspaceContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec-3");

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    let replyCitation: Citation | undefined;
    let replyText = "Based on the loaded document, this provision is governed by standard enterprise terms.";

    const lower = text.toLowerCase();
    if (lower.includes("termination") || lower.includes("retention") || lower.includes("purge") || lower.includes("section 4")) {
      replyText = "Section 4.2 mandates that all temporary memory allocations, cached document representations, and session vectors must be irrevocably purged within 30 days of termination notice.";
      replyCitation = {
        id: `cit-${Date.now()}`,
        page: 7,
        clause: "Clause 4.2",
        excerpt: "All temporary memory allocations, cached document representations, and session vectors must be irrevocably purged within 30 calendar days...",
        sectionId: "sec-3",
      };
      setSelectedSectionId("sec-3");
    } else if (lower.includes("liability") || lower.includes("cap") || lower.includes("section 6")) {
      replyText = "Section 6.1 establishes that aggregate liability is capped at the total amount paid by the Customer in the preceding twelve (12) months, excluding IP breaches and gross negligence.";
      replyCitation = {
        id: `cit-${Date.now()}`,
        page: 9,
        clause: "Clause 6.1",
        excerpt: "Neither party's total aggregate liability arising out of or related to this Agreement shall exceed the total amount paid by Customer in the preceding twelve (12) months.",
        sectionId: "sec-4",
      };
      setSelectedSectionId("sec-4");
    } else if (lower.includes("training") || lower.includes("model") || lower.includes("ownership") || lower.includes("section 2")) {
      replyText = "Section 2.4 explicitly guarantees that Customer retains exclusive data ownership and that Service Provider shall not use Customer Data for model training or permanent archiving.";
      replyCitation = {
        id: `cit-${Date.now()}`,
        page: 3,
        clause: "Clause 2.4",
        excerpt: "Customer retains sole and exclusive ownership... Service Provider shall not use Customer Data for model training or permanent archiving.",
        sectionId: "sec-2",
      };
      setSelectedSectionId("sec-2");
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: "assistant",
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      citations: replyCitation ? [replyCitation] : undefined,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  const handleSelectCitation = (citation: Citation) => {
    setSelectedSectionId(citation.sectionId);
  };

  const handleClearSession = () => {
    setMessages([]);
    setSelectedSectionId(null);
  };

  return (
    <div className="pb-16">
      <Container size="xl">
        <WorkspaceHeader
          document={SAMPLE_DOCUMENT}
          onClearSession={handleClearSession}
        />

        {/* Split Layout: Document Viewer (Left) & Chat/Intelligence Console (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 h-[680px]">
            <DocumentViewer
              document={SAMPLE_DOCUMENT}
              selectedSectionId={selectedSectionId}
              onSelectSection={setSelectedSectionId}
            />
          </div>

          <div className="lg:col-span-7 h-[680px]">
            <ChatConsole
              messages={messages}
              onSendMessage={handleSendMessage}
              onSelectCitation={handleSelectCitation}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
