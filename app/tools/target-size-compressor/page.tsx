import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TargetSizeCompressor } from "@/components/tools/target-size-compressor/target-size-compressor";

export const metadata: Metadata = {
  title: "1 MB Compressor — Compress Files to 1 MB or Less | KALVEX",
  description:
    "Compress supported files (JPG, PNG, WebP, PDF) to 1 MB or less directly in your browser with client-side, privacy-first processing and zero server uploads.",
};

export default function TargetSizeCompressorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <TargetSizeCompressor />
      </main>
      <Footer />
    </div>
  );
}
