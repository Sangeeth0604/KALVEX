"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { WorkspaceHeader } from "./workspace-header";
import { DocumentViewer } from "./document-viewer";
import { ChatConsole } from "./chat-console";
import {
  SAMPLE_DOCUMENT,
  INITIAL_CHAT_MESSAGES,
} from "@/lib/ai-workspace/mock-data";
import { ChatMessage, Citation } from "@/lib/ai-workspace/types";
import { DocumentArtifact } from "@/lib/document-bus/types";
import { documentBus } from "@/lib/document-bus/document-bus";

function AiWorkspaceInner() {
  const searchParams = useSearchParams();
  const artifactParam = searchParams.get("artifact") || searchParams.get("docId");

  const [artifact, setArtifact] = useState<DocumentArtifact | null>(null);
  const [notFoundId, setNotFoundId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec-3");

  // Load artifact transferred from Document Bus
  useEffect(() => {
    if (!artifactParam) return;
    const timer = setTimeout(() => {
      const art = documentBus.getArtifact(artifactParam);
      if (art) {
        setArtifact(art);
        setNotFoundId(null);
        setSelectedSectionId("block-1");
        // Add initial greeting acknowledging the received document artifact
        const textPreview = art.metadata?.text ? ` (${art.metadata.text.length} characters indexed)` : "";
        setMessages([
          {
            id: `msg-welcome`,
            sender: "assistant",
            text: `Document artifact "${art.name}" received via Document Bus from ${art.sourceTool}.${textPreview} Binary payload (${art.mimeType}) buffered in local RAM. You may inspect document blocks on the left or test console interactions.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        // Artifact ID not found in memory (e.g. refreshed session or invalid ID)
        setNotFoundId(artifactParam);
        setArtifact(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [artifactParam]);

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
    if (artifact) {
      documentBus.removeArtifact(artifact.id);
    }
    setMessages([]);
    setArtifact(null);
    setNotFoundId(null);
    setSelectedSectionId(null);
  };

  const handleOpenDocument = () => {
    setSelectedSectionId("block-1");
  };

  return (
    <div className="pb-16">
      <Container size="xl">
        <WorkspaceHeader
          document={SAMPLE_DOCUMENT}
          artifact={artifact}
          notFoundId={notFoundId}
          onClearSession={handleClearSession}
          onOpenDocument={artifact ? handleOpenDocument : undefined}
        />

        {/* Split Layout: Document Viewer (Left) & Chat/Intelligence Console (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 h-[680px]">
            <DocumentViewer
              document={SAMPLE_DOCUMENT}
              artifact={artifact}
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

export function AiWorkspaceContainer() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-text-muted">
          Loading AI Workspace...
        </div>
      }
    >
      <AiWorkspaceInner />
    </Suspense>
  );
}
