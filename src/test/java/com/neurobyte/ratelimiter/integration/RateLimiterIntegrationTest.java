package com.neurobyte.ratelimiter.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.neurobyte.ratelimiter.config.RedisIntegrationTestBase;

@SpringBootTest
@AutoConfigureMockMvc
class RateLimiterIntegrationTest extends RedisIntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void setup() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    @Test
    void shouldCreateRuleAndEnforceLimit() throws Exception {
        String createRule = """
                {
                  "algorithmType": "FIXED_WINDOW",
                  "limit": 2,
                  "windowSizeSeconds": 60,
                  "scopeType": "USER",
                  "identifierValue": "user123",
                  "endpointPattern": "/api/payments",
                  "enabled": true
                }
                """;

        mockMvc.perform(post("/api/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRule))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ruleId").exists());

        String checkBody = """
                {
                  "userId": "user123",
                  "endpoint": "/api/payments",
                  "timestamp": "2026-01-01T00:00:00Z"
                }
                """;

        mockMvc.perform(post("/api/rate-limit/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true));

        mockMvc.perform(post("/api/rate-limit/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true));

        mockMvc.perform(post("/api/rate-limit/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkBody))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.allowed").value(false));
    }
}
