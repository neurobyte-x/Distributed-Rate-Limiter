package com.neurobyte.ratelimiter.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RequestContext {
    String userId;
    String ipAddress;
    String endpoint;
    Instant timestamp;
}
