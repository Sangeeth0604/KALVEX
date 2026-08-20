import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { PrivacyArchitecture } from "@/components/marketing/privacy-architecture";
import { ToolsShowcase } from "@/components/marketing/tools-showcase";
import { ConnectedWorkflowsShowcase } from "@/components/marketing/connected-workflows-showcase";
import { AiWorkspacePreview } from "@/components/marketing/ai-workspace-preview";
import { WorkflowSteps } from "@/components/marketing/workflow-steps";
import { CtaSection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <PrivacyArchitecture />
        <ToolsShowcase />
        <ConnectedWorkflowsShowcase />
        <AiWorkspacePreview />
        <WorkflowSteps />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
