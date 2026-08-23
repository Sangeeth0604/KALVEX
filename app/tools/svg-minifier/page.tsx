import { Metadata } from "next";
import { SvgMinifier } from "@/components/tools/svg-minifier/svg-minifier";

export const metadata: Metadata = {
  title: "SVG Vector Minifier — KALVEX",
  description: "Clean vector paths, remove editor artifacts, and minimize SVG file weight.",
};

export default function SvgMinifierPage() {
  return <SvgMinifier />;
}
