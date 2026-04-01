package com.neurobyte.ratelimiter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RateLimitRule {
    private String ruleId;
    private AlgorithmType algorithmType;
    private long limit;
    private long windowSizeSeconds;
    private Double refillRatePerSecond;
    private Long burstCapacity;
    private ScopeType scopeType;
    private String identifierValue;
    private String endpointPattern;
    private boolean enabled;
}
