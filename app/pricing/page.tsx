import { Metadata } from "next";
import { PricingContainer } from "@/components/pricing/pricing-container";

export const metadata: Metadata = {
  title: "KALVEX — Free Privacy-First Document Tools",
  description:
    "Use KALVEX's privacy-first document tools for free. Compress, convert, create, extract, and understand documents directly in your browser.",
};

export default function PricingPage() {
  return <PricingContainer />;
}
