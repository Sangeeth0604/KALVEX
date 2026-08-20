import { Metadata } from "next";
import { WorkflowsContainer } from "@/components/workflows/workflows-container";

export const metadata: Metadata = {
  title: "Saved Workflows | KALVEX",
  description: "Automate and execute sequential document processing pipelines combining compression, OCR, and AI analysis.",
};

export default function WorkflowsPage() {
  return <WorkflowsContainer />;
}
