import type { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";

export const metadata: Metadata = {
  title: "Overview",
  description: "Live rate-limiting decisions, policy composition, and service health.",
};

export default function OverviewPage() {
  return <Overview />;
}
