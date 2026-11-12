import type {
  ApiErrorBody,
  HealthReport,
  RateLimitCheckRequest,
  RateLimitCheckResponse,
  RateLimitRule,
  RuleInput,
} from "./types";

export class ApiError extends Error {
  status: number;
  details: string[];
  offline: boolean;

  constructor(message: string, status: number, details: string[] = [], offline = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.offline = offline;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      "The rate limiter API is unreachable. Start the Spring Boot service and try again.",
      0,
      [],
      true,
    );
  }

  const data = await readBody(response);

  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message
        : response.status === 503
          ? "The rate limiter API is unreachable."
          : `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, body.details ?? [], response.status === 503);
  }

  return data as T;
}

export const api = {
  listRules(): Promise<RateLimitRule[]> {
    return request<RateLimitRule[]>("/api/rules");
  },

  createRule(input: RuleInput): Promise<RateLimitRule> {
    return request<RateLimitRule>("/api/rules", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateRule(ruleId: string, input: RuleInput): Promise<RateLimitRule> {
    return request<RateLimitRule>(`/api/rules/${encodeURIComponent(ruleId)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deleteRule(ruleId: string): Promise<void> {
    return request<void>(`/api/rules/${encodeURIComponent(ruleId)}`, {
      method: "DELETE",
    });
  },
};

export interface CheckOutcome {
  httpStatus: number;
  body: RateLimitCheckResponse | null;
  error: ApiError | null;
  latencyMs: number;
}

/**
 * A rate-limit check returns 429 when the request is blocked — that is a valid
 * result, not a failure, so it is parsed into the body instead of thrown.
 */
export async function checkRateLimit(payload: RateLimitCheckRequest): Promise<CheckOutcome> {
  const startedAt = performance.now();
  try {
    const response = await fetch("/api/rate-limit/check", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const data = await readBody(response);

    if (response.ok || response.status === 429) {
      return { httpStatus: response.status, body: data as RateLimitCheckResponse, error: null, latencyMs };
    }

    const body = (data ?? {}) as ApiErrorBody;
    return {
      httpStatus: response.status,
      body: null,
      error: new ApiError(
        typeof body.message === "string" ? body.message : `Check failed with status ${response.status}.`,
        response.status,
        body.details ?? [],
        response.status === 503,
      ),
      latencyMs,
    };
  } catch {
    return {
      httpStatus: 0,
      body: null,
      error: new ApiError("Could not reach the rate limiter service.", 0, [], true),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}

export async function getHealth(): Promise<HealthReport> {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        reachable: false,
        status: response.status,
        latencyMs: 0,
        checkedAt: Date.now(),
        body: null,
        error: `Health probe failed (${response.status}).`,
      };
    }
    return (await response.json()) as HealthReport;
  } catch {
    return {
      ok: false,
      reachable: false,
      status: 0,
      latencyMs: 0,
      checkedAt: Date.now(),
      body: null,
      error: "Could not reach the health probe.",
    };
  }
}
