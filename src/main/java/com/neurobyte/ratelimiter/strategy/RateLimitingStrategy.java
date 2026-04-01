package com.neurobyte.ratelimiter.strategy;

import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;

public interface RateLimitingStrategy {

    boolean supports(AlgorithmType algorithmType);

    RateLimitDecision evaluate(RateLimitRule rule, RequestContext context);
}
