import { Metadata } from "next";
import { FormGenerator } from "@/components/tools/form-generator/form-generator";

export const metadata: Metadata = {
  title: "Structured Invoice & Form Builder — KALVEX",
  description: "Generate structured standard receipts, forms, and invoices from validated JSON schemas and form data.",
};

export default function FormGeneratorPage() {
  return <FormGenerator />;
}
