import { NextResponse } from "next/server";
import type { HealthReport } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export async function GET() {
  const startedAt = Date.now();

  try {
    const upstream = await fetch(`${BACKEND_URL}/actuator/health`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4_000),
    });

    const latencyMs = Date.now() - startedAt;
    const text = await upstream.text();

    let body: HealthReport["body"] = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    const report: HealthReport = {
      ok: upstream.ok && body?.status === "UP",
      reachable: true,
      status: upstream.status,
      latencyMs,
      checkedAt: Date.now(),
      body,
      error: upstream.ok ? null : `Health endpoint returned ${upstream.status}.`,
    };

    return NextResponse.json(report);
  } catch {
    const report: HealthReport = {
      ok: false,
      reachable: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      checkedAt: Date.now(),
      body: null,
      error: `Cannot reach the backend at ${BACKEND_URL}.`,
    };
    return NextResponse.json(report);
  }
}
