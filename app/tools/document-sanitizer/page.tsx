import { Metadata } from "next";
import { DocumentSanitizer } from "@/components/tools/document-sanitizer/document-sanitizer";

export const metadata: Metadata = {
  title: "Document Sanitizer & Redactor — KALVEX",
  description: "Permanently scrub sensitive text areas and remove hidden document metadata.",
};

export default function DocumentSanitizerPage() {
  return <DocumentSanitizer />;
}
