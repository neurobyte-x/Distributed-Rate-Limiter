export type AlgorithmType =
  | "FIXED_WINDOW"
  | "SLIDING_WINDOW_LOG"
  | "SLIDING_WINDOW_COUNTER"
  | "TOKEN_BUCKET";

export type ScopeType = "GLOBAL" | "USER" | "IP" | "ENDPOINT";

export interface RateLimitRule {
  ruleId: string;
  algorithmType: AlgorithmType;
  limit: number;
  windowSizeSeconds: number;
  refillRatePerSecond: number | null;
  burstCapacity: number | null;
  scopeType: ScopeType;
  identifierValue: string | null;
  endpointPattern: string | null;
  enabled: boolean;
}

/** Payload accepted by POST/PUT /api/rules */
export interface RuleInput {
  algorithmType: AlgorithmType;
  limit: number;
  windowSizeSeconds: number;
  refillRatePerSecond: number | null;
  burstCapacity: number | null;
  scopeType: ScopeType;
  identifierValue: string | null;
  endpointPattern: string | null;
  enabled: boolean;
}

export interface RateLimitCheckRequest {
  userId?: string;
  ipAddress?: string;
  endpoint: string;
  timestamp?: string;
}

export interface RuleEvaluation {
  ruleId: string;
  algorithm: string;
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  message: string;
}

export interface RateLimitCheckResponse {
  allowed: boolean;
  algorithmUsed: string;
  remaining: number;
  retryAfterSeconds: number;
  message: string;
  evaluations: RuleEvaluation[];
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  details?: string[];
}

export type HealthStatus = "UP" | "DOWN" | "OUT_OF_SERVICE" | "UNKNOWN";

export interface HealthComponent {
  status: HealthStatus;
  details?: Record<string, unknown>;
}

export interface HealthBody {
  status: HealthStatus;
  components?: Record<string, HealthComponent>;
}

export interface HealthReport {
  ok: boolean;
  reachable: boolean;
  status: number;
  latencyMs: number;
  checkedAt: number;
  body: HealthBody | null;
  error: string | null;
}

export type ActivityDecision = "allowed" | "blocked" | "error";

export interface ActivityEntry {
  id: string;
  at: number;
  endpoint: string;
  decision: ActivityDecision;
  algorithm: string;
  httpStatus: number;
  remaining: number;
  userId?: string | null;
  ipAddress?: string | null;
  source: "dashboard" | "playground" | "burst";
}

export interface BurstAttempt {
  index: number;
  allowed: boolean;
  remaining: number;
  status: number;
  retryAfterSeconds: number;
  at: number;
}
