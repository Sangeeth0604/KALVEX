import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ToolsDirectory } from "@/components/tools/tools-directory";

export const metadata: Metadata = {
  title: "Tools Directory — KALVEX",
  description:
    "Discover client-side and zero-retention tools across conversion, compression, creation, and document understanding.",
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <ToolsDirectory />
      </main>
      <Footer />
    </div>
  );
}
