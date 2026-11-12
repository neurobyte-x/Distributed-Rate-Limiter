"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";
import type { RateLimitRule, RuleInput } from "@/lib/types";
import { toRuleInput } from "@/lib/utils";

type LoadStatus = "loading" | "ready" | "error";

interface RulesContextValue {
  rules: RateLimitRule[];
  status: LoadStatus;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRule: (input: RuleInput) => Promise<RateLimitRule>;
  updateRule: (ruleId: string, input: RuleInput) => Promise<RateLimitRule>;
  deleteRule: (ruleId: string) => Promise<void>;
  toggleRule: (rule: RateLimitRule) => Promise<void>;
}

const RulesContext = createContext<RulesContextValue | null>(null);

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

export function RulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (initial: boolean) => {
    if (initial) {
      setStatus("loading");
    } else {
      setRefreshing(true);
    }

    try {
      const data = await api.listRules();
      setRules(data);
      setError(null);
      setStatus("ready");
    } catch (loadError) {
      setError(messageOf(loadError, "Could not load rate limit rules."));
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(false);
  }, [load]);

  const createRule = useCallback(async (input: RuleInput) => {
    const created = await api.createRule(input);
    setRules((current) => [...current, created]);
    return created;
  }, []);

  const updateRule = useCallback(async (ruleId: string, input: RuleInput) => {
    const updated = await api.updateRule(ruleId, input);
    setRules((current) => current.map((rule) => (rule.ruleId === ruleId ? updated : rule)));
    return updated;
  }, []);

  const deleteRule = useCallback(async (ruleId: string) => {
    await api.deleteRule(ruleId);
    setRules((current) => current.filter((rule) => rule.ruleId !== ruleId));
  }, []);

  const toggleRule = useCallback(async (rule: RateLimitRule) => {
    const optimistic: RateLimitRule = { ...rule, enabled: !rule.enabled };
    setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? optimistic : item)));

    try {
      const updated = await api.updateRule(rule.ruleId, toRuleInput(optimistic));
      setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? updated : item)));
    } catch (toggleError) {
      setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? rule : item)));
      throw toggleError;
    }
  }, []);

  const value = useMemo(
    () => ({
      rules,
      status,
      refreshing,
      error,
      refresh,
      createRule,
      updateRule,
      deleteRule,
      toggleRule,
    }),
    [rules, status, refreshing, error, refresh, createRule, updateRule, deleteRule, toggleRule],
  );

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>;
}

export function useRules() {
  const context = useContext(RulesContext);
  if (!context) throw new Error("useRules must be used inside RulesProvider");
  return context;
}
