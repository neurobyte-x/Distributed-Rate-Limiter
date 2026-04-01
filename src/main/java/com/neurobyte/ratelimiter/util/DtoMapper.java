package com.neurobyte.ratelimiter.util;

import java.time.Instant;

import com.neurobyte.ratelimiter.dto.request.RateLimitCheckRequest;
import com.neurobyte.ratelimiter.dto.request.RateLimitRuleUpsertRequest;
import com.neurobyte.ratelimiter.dto.response.RateLimitCheckResponse;
import com.neurobyte.ratelimiter.dto.response.RateLimitRuleResponse;
import com.neurobyte.ratelimiter.model.RateLimitCheckResult;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static RateLimitRule toModel(RateLimitRuleUpsertRequest request) {
        return RateLimitRule.builder()
                .algorithmType(request.getAlgorithmType())
                .limit(request.getLimit())
                .windowSizeSeconds(request.getWindowSizeSeconds())
                .refillRatePerSecond(request.getRefillRatePerSecond())
                .burstCapacity(request.getBurstCapacity())
                .scopeType(request.getScopeType())
                .identifierValue(request.getIdentifierValue())
                .endpointPattern(request.getEndpointPattern())
                .enabled(request.isEnabled())
                .build();
    }

    public static RateLimitRuleResponse toResponse(RateLimitRule rule) {
        return RateLimitRuleResponse.builder()
                .ruleId(rule.getRuleId())
                .algorithmType(rule.getAlgorithmType())
                .limit(rule.getLimit())
                .windowSizeSeconds(rule.getWindowSizeSeconds())
                .refillRatePerSecond(rule.getRefillRatePerSecond())
                .burstCapacity(rule.getBurstCapacity())
                .scopeType(rule.getScopeType())
                .identifierValue(rule.getIdentifierValue())
                .endpointPattern(rule.getEndpointPattern())
                .enabled(rule.isEnabled())
                .build();
    }

    public static RequestContext toContext(RateLimitCheckRequest request) {
        return RequestContext.builder()
                .userId(request.getUserId())
                .ipAddress(request.getIpAddress())
                .endpoint(request.getEndpoint())
                .timestamp(request.getTimestamp() == null ? Instant.now() : request.getTimestamp())
                .build();
    }

    public static RateLimitCheckResponse toCheckResponse(RateLimitCheckResult result) {
        return RateLimitCheckResponse.builder()
                .allowed(result.isAllowed())
                .algorithmUsed(result.getAlgorithmUsed())
                .remaining(result.getRemaining())
                .retryAfterSeconds(result.getRetryAfterSeconds())
                .message(result.getMessage())
                .evaluations(result.getDecisions().stream().map(DtoMapper::toEvaluation).toList())
                .build();
    }

    private static RateLimitCheckResponse.RuleEvaluationResponse toEvaluation(RateLimitDecision decision) {
        return RateLimitCheckResponse.RuleEvaluationResponse.builder()
                .ruleId(decision.getRuleId())
                .algorithm(decision.getAlgorithm())
                .allowed(decision.isAllowed())
                .remaining(decision.getRemaining())
                .retryAfterSeconds(decision.getRetryAfterSeconds())
                .message(decision.getMessage())
                .build();
    }
}
