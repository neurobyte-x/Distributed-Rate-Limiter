import type { Metadata } from "next";
import { PlaygroundView } from "@/components/playground/playground-view";

export const metadata: Metadata = {
  title: "Playground",
  description: "Simulate request contexts and inspect rate limiter decisions.",
};

export default function PlaygroundPage() {
  return <PlaygroundView />;
}
