import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is used by the Docker image. It is opt-in because pnpm's
  // symlinked store cannot be copied into .next/standalone on Windows.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
