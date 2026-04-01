package com.neurobyte.ratelimiter.dto.response;

import java.time.Instant;
import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiErrorResponse {
    Instant timestamp;
    int status;
    String error;
    String message;
    List<String> details;
}
