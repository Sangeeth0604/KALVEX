import { Metadata } from "next";
import { PdfToOffice } from "@/components/tools/pdf-to-office/pdf-to-office";

export const metadata: Metadata = {
  title: "PDF to Office Formats — KALVEX",
  description: "Transform PDF documents into editable Word (DOCX) and Excel (XLSX) structures with layout and table retention.",
};

export default function PdfToOfficePage() {
  return <PdfToOffice />;
}
