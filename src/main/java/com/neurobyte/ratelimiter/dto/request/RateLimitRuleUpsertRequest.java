package com.neurobyte.ratelimiter.dto.request;

import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.ScopeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RateLimitRuleUpsertRequest {

    @NotNull
    private AlgorithmType algorithmType;

    @Min(1)
    private long limit;

    @Min(1)
    private long windowSizeSeconds;

    @DecimalMin("0.0001")
    private Double refillRatePerSecond;

    @Min(1)
    private Long burstCapacity;

    @NotNull
    private ScopeType scopeType;

    private String identifierValue;
    private String endpointPattern;
    private boolean enabled = true;
}
