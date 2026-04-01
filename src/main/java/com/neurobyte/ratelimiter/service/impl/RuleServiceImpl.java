package com.neurobyte.ratelimiter.service.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.neurobyte.ratelimiter.exception.InvalidRuleException;
import com.neurobyte.ratelimiter.exception.RuleNotFoundException;
import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.ScopeType;
import com.neurobyte.ratelimiter.repository.RateLimitRuleRepository;
import com.neurobyte.ratelimiter.service.RuleService;

@Service
public class RuleServiceImpl implements RuleService {

    private final RateLimitRuleRepository repository;

    public RuleServiceImpl(RateLimitRuleRepository repository) {
        this.repository = repository;
    }

    @Override
    public RateLimitRule createRule(RateLimitRule rule) {
        validateRule(rule);
        rule.setRuleId(UUID.randomUUID().toString());
        return repository.save(rule);
    }

    @Override
    public RateLimitRule updateRule(String ruleId, RateLimitRule rule) {
        getRule(ruleId);
        validateRule(rule);
        rule.setRuleId(ruleId);
        return repository.save(rule);
    }

    @Override
    public RateLimitRule getRule(String ruleId) {
        return repository.findById(ruleId).orElseThrow(() -> new RuleNotFoundException(ruleId));
    }

    @Override
    public List<RateLimitRule> listRules() {
        return repository.findAll();
    }

    @Override
    public void deleteRule(String ruleId) {
        getRule(ruleId);
        repository.deleteById(ruleId);
    }

    private void validateRule(RateLimitRule rule) {
        if (rule.getScopeType() != ScopeType.GLOBAL && (rule.getIdentifierValue() == null || rule.getIdentifierValue().isBlank())) {
            throw new InvalidRuleException("identifierValue is required for non-global scopes");
        }

        if (rule.getAlgorithmType() == AlgorithmType.TOKEN_BUCKET) {
            if (rule.getRefillRatePerSecond() == null || rule.getRefillRatePerSecond() <= 0) {
                throw new InvalidRuleException("refillRatePerSecond must be set and > 0 for TOKEN_BUCKET");
            }
            if (rule.getBurstCapacity() == null || rule.getBurstCapacity() <= 0) {
                throw new InvalidRuleException("burstCapacity must be set and > 0 for TOKEN_BUCKET");
            }
        }

        if (rule.getAlgorithmType() != AlgorithmType.TOKEN_BUCKET) {
            if (rule.getWindowSizeSeconds() <= 0) {
                throw new InvalidRuleException("windowSizeSeconds must be > 0 for window algorithms");
            }
            if (rule.getLimit() <= 0) {
                throw new InvalidRuleException("limit must be > 0");
            }
        }
    }
}
