package com.neurobyte.ratelimiter.service;

import java.util.List;

import com.neurobyte.ratelimiter.model.RateLimitRule;

public interface RuleService {
    RateLimitRule createRule(RateLimitRule rule);

    RateLimitRule updateRule(String ruleId, RateLimitRule rule);

    RateLimitRule getRule(String ruleId);

    List<RateLimitRule> listRules();

    void deleteRule(String ruleId);
}
