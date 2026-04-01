package com.neurobyte.ratelimiter.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurobyte.ratelimiter.exception.GlobalExceptionHandler;
import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.ScopeType;
import com.neurobyte.ratelimiter.service.RuleService;

@WebMvcTest(controllers = RuleController.class)
class RuleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RuleService ruleService;

    @MockBean
    private GlobalExceptionHandler globalExceptionHandler;

    @Test
    void shouldCreateRule() throws Exception {
        RateLimitRule stored = RateLimitRule.builder()
                .ruleId("rule-1")
                .algorithmType(AlgorithmType.FIXED_WINDOW)
                .limit(10)
                .windowSizeSeconds(60)
                .scopeType(ScopeType.USER)
                .identifierValue("user123")
                .enabled(true)
                .build();

        when(ruleService.createRule(any())).thenReturn(stored);

        String body = """
                {
                  "algorithmType": "FIXED_WINDOW",
                  "limit": 10,
                  "windowSizeSeconds": 60,
                  "scopeType": "USER",
                  "identifierValue": "user123",
                  "enabled": true
                }
                """;

        mockMvc.perform(post("/api/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ruleId").value("rule-1"));
    }

    @Test
    void shouldValidateRequest() throws Exception {
        String body = """
                {
                  "algorithmType": "FIXED_WINDOW",
                  "limit": 0,
                  "windowSizeSeconds": 60,
                  "scopeType": "USER"
                }
                """;

        mockMvc.perform(post("/api/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldGetRule() throws Exception {
        RateLimitRule stored = RateLimitRule.builder()
                .ruleId("rule-1")
                .algorithmType(AlgorithmType.FIXED_WINDOW)
                .limit(10)
                .windowSizeSeconds(60)
                .scopeType(ScopeType.GLOBAL)
                .enabled(true)
                .build();

        when(ruleService.getRule("rule-1")).thenReturn(stored);

        mockMvc.perform(get("/api/rules/rule-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.algorithmType").value("FIXED_WINDOW"));
    }
}
