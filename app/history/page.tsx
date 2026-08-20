import { Metadata } from "next";
import { HistoryContainer } from "@/components/history/history-container";

export const metadata: Metadata = {
  title: "Operation History | KALVEX",
  description: "View local activity history, compression savings, and operation outcomes in this browser.",
};

export default function HistoryPage() {
  return <HistoryContainer />;
}
