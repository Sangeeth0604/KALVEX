import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AiWorkspaceContainer } from "@/components/ai-workspace/ai-workspace-container";

export const metadata: Metadata = {
  title: "AI Workspace — KALVEX",
  description:
    "Controlled document intelligence console with verified source citations and session memory isolation.",
};

export default function AiWorkspacePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <AiWorkspaceContainer />
      </main>
      <Footer />
    </div>
  );
}
