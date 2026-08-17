import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ImageCompressor } from "@/components/tools/image-compressor/image-compressor";

export const metadata: Metadata = {
  title: "Image Compressor — KALVEX",
  description:
    "Compress PNG, JPG, JPEG, and WebP images locally in your browser with zero server uploads. High-performance, client-side image optimization.",
};

export default function ImageCompressorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <ImageCompressor />
      </main>
      <Footer />
    </div>
  );
}
