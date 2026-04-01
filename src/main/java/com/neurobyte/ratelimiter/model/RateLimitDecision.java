package com.neurobyte.ratelimiter.model;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RateLimitDecision {
    String ruleId;
    String algorithm;
    boolean allowed;
    long remaining;
    long retryAfterSeconds;
    String message;
}
