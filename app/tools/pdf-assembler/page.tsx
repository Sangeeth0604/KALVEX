import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PdfAssembler } from "@/components/tools/pdf-assembler/pdf-assembler";

export const metadata: Metadata = {
  title: "PDF Assembler & Splitter — KALVEX",
  description:
    "Merge, split, reorder, rotate, delete, and extract PDF pages locally in your browser with zero server uploads. Real-time client-side PDF document manipulation.",
};

export default function PdfAssemblerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <PdfAssembler />
      </main>
      <Footer />
    </div>
  );
}
