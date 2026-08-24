import { Metadata } from "next";
import { DashboardContainer } from "@/components/dashboard/dashboard-container";

export const metadata: Metadata = {
  title: "Dashboard — KALVEX Workspace",
  description: "Central KALVEX workspace for converting, compressing, creating, and understanding files with zero server storage.",
};

export default function DashboardPage() {
  return <DashboardContainer />;
}
