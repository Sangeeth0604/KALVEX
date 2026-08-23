import { Metadata } from "next";
import { DiffAnalyzer } from "@/components/tools/diff-analyzer/diff-analyzer";

export const metadata: Metadata = {
  title: "Document Difference Analyzer — KALVEX",
  description: "Compare two document revisions side-by-side to highlight textual and structural changes.",
};

export default function DiffAnalyzerPage() {
  return <DiffAnalyzer />;
}
