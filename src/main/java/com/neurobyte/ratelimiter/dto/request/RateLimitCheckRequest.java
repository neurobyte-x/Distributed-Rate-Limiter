package com.neurobyte.ratelimiter.dto.request;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RateLimitCheckRequest {
    private String userId;
    private String ipAddress;

    @NotBlank
    private String endpoint;

    private Instant timestamp;
}
