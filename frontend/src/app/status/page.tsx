import type { Metadata } from "next";
import { StatusView } from "@/components/status/status-view";

export const metadata: Metadata = {
  title: "System status",
  description: "Backend and Redis health, connectivity, and API reference.",
};

export default function StatusPage() {
  return <StatusView />;
}
