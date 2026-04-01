package com.neurobyte.ratelimiter.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.AntPathMatcher;

import com.neurobyte.ratelimiter.model.RateLimitCheckResult;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;
import com.neurobyte.ratelimiter.model.ScopeType;
import com.neurobyte.ratelimiter.service.RateLimitService;
import com.neurobyte.ratelimiter.service.RuleService;
import com.neurobyte.ratelimiter.strategy.RateLimitingStrategy;
import com.neurobyte.ratelimiter.strategy.RateLimitingStrategyFactory;

@Service
public class RateLimitServiceImpl implements RateLimitService {

    private final RuleService ruleService;
    private final RateLimitingStrategyFactory strategyFactory;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public RateLimitServiceImpl(RuleService ruleService, RateLimitingStrategyFactory strategyFactory) {
        this.ruleService = ruleService;
        this.strategyFactory = strategyFactory;
    }

    @Override
    public RateLimitCheckResult check(RequestContext context) {
        List<RateLimitRule> rules = ruleService.listRules().stream()
                .filter(RateLimitRule::isEnabled)
                .filter(rule -> matchesRule(rule, context))
                .toList();

        if (rules.isEmpty()) {
            return RateLimitCheckResult.builder()
                    .allowed(true)
                    .algorithmUsed("NONE")
                    .remaining(Long.MAX_VALUE)
                    .retryAfterSeconds(0)
                    .message("No matching enabled rules")
                    .decisions(List.of())
                    .build();
        }

        List<RateLimitDecision> decisions = new ArrayList<>();
        for (RateLimitRule rule : rules) {
            RateLimitingStrategy strategy = strategyFactory.getByAlgorithm(rule.getAlgorithmType());
            decisions.add(strategy.evaluate(rule, context));
        }

        RateLimitDecision blocked = decisions.stream().filter(d -> !d.isAllowed()).findFirst().orElse(null);
        if (blocked != null) {
            return RateLimitCheckResult.builder()
                    .allowed(false)
                    .algorithmUsed(blocked.getAlgorithm())
                    .remaining(blocked.getRemaining())
                    .retryAfterSeconds(blocked.getRetryAfterSeconds())
                    .message("Rate limit exceeded")
                    .decisions(decisions)
                    .build();
        }

        long minRemaining = decisions.stream().mapToLong(RateLimitDecision::getRemaining).min().orElse(Long.MAX_VALUE);
        String algorithmUsed = decisions.size() == 1
                ? decisions.getFirst().getAlgorithm()
                : "MULTIPLE";

        return RateLimitCheckResult.builder()
                .allowed(true)
                .algorithmUsed(algorithmUsed)
                .remaining(minRemaining)
                .retryAfterSeconds(0)
                .message("Request allowed")
                .decisions(decisions)
                .build();
    }

    private boolean matchesRule(RateLimitRule rule, RequestContext context) {
        if (rule.getEndpointPattern() != null && !rule.getEndpointPattern().isBlank()
                && !pathMatcher.match(rule.getEndpointPattern(), context.getEndpoint())) {
            return false;
        }

        return switch (rule.getScopeType()) {
            case GLOBAL -> true;
            case USER -> rule.getIdentifierValue().equals(context.getUserId());
            case IP -> rule.getIdentifierValue().equals(context.getIpAddress());
            case ENDPOINT -> endpointScopeMatch(rule, context);
        };
    }

    private boolean endpointScopeMatch(RateLimitRule rule, RequestContext context) {
        String identifier = rule.getIdentifierValue();
        if (identifier == null || identifier.isBlank()) {
            return false;
        }
        return pathMatcher.match(identifier, context.getEndpoint());
    }
}
