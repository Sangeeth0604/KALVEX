import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FormatConverter } from "@/components/tools/format-converter/format-converter";

export const metadata: Metadata = {
  title: "Universal Format Converter — KALVEX",
  description:
    "Convert between PNG, JPG, and WEBP image formats, or render PDF pages into high-resolution images locally in your browser memory.",
};

export default function FormatConverterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <FormatConverter />
      </main>
      <Footer />
    </div>
  );
}
