import { Metadata } from "next";
import { MarkdownToPdf } from "@/components/tools/markdown-to-pdf/markdown-to-pdf";

export const metadata: Metadata = {
  title: "Markdown & HTML to PDF — KALVEX",
  description: "Render technical markdown documentation and HTML code into clean, paginated PDF documents.",
};

export default function MarkdownToPdfPage() {
  return <MarkdownToPdf />;
}
