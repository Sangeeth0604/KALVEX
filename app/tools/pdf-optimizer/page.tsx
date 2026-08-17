import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PdfOptimizer } from "@/components/tools/pdf-optimizer/pdf-optimizer";

export const metadata: Metadata = {
  title: "PDF Stream & Structure Optimizer — KALVEX",
  description:
    "Optimize PDF document structure, pack cross-reference tables into binary Object Streams, prune historical edit revisions, and scrub metadata locally in your browser memory.",
};

export default function PdfOptimizerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <PdfOptimizer />
      </main>
      <Footer />
    </div>
  );
}
