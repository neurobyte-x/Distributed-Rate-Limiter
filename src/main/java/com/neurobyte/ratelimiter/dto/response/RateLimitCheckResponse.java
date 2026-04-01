package com.neurobyte.ratelimiter.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RateLimitCheckResponse {
    boolean allowed;
    String algorithmUsed;
    long remaining;
    long retryAfterSeconds;
    String message;
    List<RuleEvaluationResponse> evaluations;

    @Value
    @Builder
    public static class RuleEvaluationResponse {
        String ruleId;
        String algorithm;
        boolean allowed;
        long remaining;
        long retryAfterSeconds;
        String message;
    }
}
