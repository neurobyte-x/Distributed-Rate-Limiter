package com.neurobyte.ratelimiter.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.neurobyte.ratelimiter.model.RateLimitCheckResult;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.service.RateLimitService;

@WebMvcTest(controllers = RateLimitController.class)
class RateLimitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RateLimitService rateLimitService;

    @Test
    void shouldReturnOkWhenAllowed() throws Exception {
        when(rateLimitService.check(any())).thenReturn(
                RateLimitCheckResult.builder()
                        .allowed(true)
                        .algorithmUsed("FIXED_WINDOW")
                        .remaining(4)
                        .retryAfterSeconds(0)
                        .message("Request allowed")
                        .decisions(List.of(
                                RateLimitDecision.builder()
                                        .ruleId("rule-1")
                                        .algorithm("FIXED_WINDOW")
                                        .allowed(true)
                                        .remaining(4)
                                        .retryAfterSeconds(0)
                                        .message("ok")
                                        .build()
                        ))
                        .build()
        );

        String body = """
                {
                  "userId": "user123",
                  "endpoint": "/api/payments"
                }
                """;

        mockMvc.perform(post("/api/rate-limit/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true));
    }

    @Test
    void shouldReturn429WhenBlocked() throws Exception {
        when(rateLimitService.check(any())).thenReturn(
                RateLimitCheckResult.builder()
                        .allowed(false)
                        .algorithmUsed("TOKEN_BUCKET")
                        .remaining(0)
                        .retryAfterSeconds(2)
                        .message("Rate limit exceeded")
                        .decisions(List.of())
                        .build()
        );

        String body = """
                {
                  "userId": "user123",
                  "endpoint": "/api/payments"
                }
                """;

        mockMvc.perform(post("/api/rate-limit/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.retryAfterSeconds").value(2));
    }
}
