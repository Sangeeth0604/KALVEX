import { Metadata } from "next";
import { SettingsContainer } from "@/components/settings/settings-container";

export const metadata: Metadata = {
  title: "Settings — KALVEX Workspace",
  description: "Configure appearance, privacy controls, processing defaults, and manage local data stored in this browser.",
};

export default function SettingsPage() {
  return <SettingsContainer />;
}
