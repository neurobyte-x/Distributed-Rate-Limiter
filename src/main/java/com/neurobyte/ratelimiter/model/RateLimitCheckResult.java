package com.neurobyte.ratelimiter.model;

import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RateLimitCheckResult {
    boolean allowed;
    String algorithmUsed;
    long remaining;
    long retryAfterSeconds;
    String message;
    List<RateLimitDecision> decisions;
}
