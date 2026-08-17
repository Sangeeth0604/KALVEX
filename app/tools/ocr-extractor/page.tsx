import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OcrExtractor } from "@/components/tools/ocr-extractor/ocr-extractor";

export const metadata: Metadata = {
  title: "Private OCR Text Extractor — KALVEX",
  description:
    "Extract text from PNG, JPG, JPEG, WEBP images, and multi-page PDF documents locally in your browser with zero server uploads. High-performance client-side WebAssembly character extraction.",
};

export default function OcrExtractorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <OcrExtractor />
      </main>
      <Footer />
    </div>
  );
}
