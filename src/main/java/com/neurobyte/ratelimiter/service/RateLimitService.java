package com.neurobyte.ratelimiter.service;

import com.neurobyte.ratelimiter.model.RateLimitCheckResult;
import com.neurobyte.ratelimiter.model.RequestContext;

public interface RateLimitService {
    RateLimitCheckResult check(RequestContext context);
}
