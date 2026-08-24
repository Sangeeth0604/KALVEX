import { Metadata } from "next";
import { PricingContainer } from "@/components/pricing/pricing-container";

export const metadata: Metadata = {
  title: "Pricing & Plans — KALVEX",
  description: "Transparent pricing for privacy-first document productivity. Free during our Public Beta.",
};

export default function PricingPage() {
  return <PricingContainer />;
}
