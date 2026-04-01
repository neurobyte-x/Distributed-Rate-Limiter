package com.neurobyte.ratelimiter.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neurobyte.ratelimiter.dto.request.RateLimitCheckRequest;
import com.neurobyte.ratelimiter.dto.response.RateLimitCheckResponse;
import com.neurobyte.ratelimiter.model.RateLimitCheckResult;
import com.neurobyte.ratelimiter.service.RateLimitService;
import com.neurobyte.ratelimiter.util.DtoMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rate-limit")
@Validated
public class RateLimitController {

    private final RateLimitService rateLimitService;

    public RateLimitController(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/check")
    public ResponseEntity<RateLimitCheckResponse> checkRateLimit(@Valid @RequestBody RateLimitCheckRequest request) {
        RateLimitCheckResult result = rateLimitService.check(DtoMapper.toContext(request));
        HttpStatus status = result.isAllowed() ? HttpStatus.OK : HttpStatus.TOO_MANY_REQUESTS;
        return ResponseEntity.status(status).body(DtoMapper.toCheckResponse(result));
    }
}
