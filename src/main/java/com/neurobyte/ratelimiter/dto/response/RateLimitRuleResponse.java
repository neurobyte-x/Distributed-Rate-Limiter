package com.neurobyte.ratelimiter.dto.response;

import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.ScopeType;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RateLimitRuleResponse {
    String ruleId;
    AlgorithmType algorithmType;
    long limit;
    long windowSizeSeconds;
    Double refillRatePerSecond;
    Long burstCapacity;
    ScopeType scopeType;
    String identifierValue;
    String endpointPattern;
    boolean enabled;
}
