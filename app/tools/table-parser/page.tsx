import { Metadata } from "next";
import { TableParser } from "@/components/tools/table-parser/table-parser";

export const metadata: Metadata = {
  title: "Tabular Structure Parser — KALVEX",
  description: "Extract tables and structured grids from PDFs, text files, and OCR outputs into clean CSV, JSON, Markdown, and Excel spreadsheets.",
};

export default function TableParserPage() {
  return <TableParser />;
}
