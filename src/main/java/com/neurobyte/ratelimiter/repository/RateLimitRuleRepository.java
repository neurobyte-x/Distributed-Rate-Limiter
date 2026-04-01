package com.neurobyte.ratelimiter.repository;

import java.util.List;
import java.util.Optional;

import com.neurobyte.ratelimiter.model.RateLimitRule;

public interface RateLimitRuleRepository {
    RateLimitRule save(RateLimitRule rule);

    Optional<RateLimitRule> findById(String ruleId);

    List<RateLimitRule> findAll();

    void deleteById(String ruleId);
}
