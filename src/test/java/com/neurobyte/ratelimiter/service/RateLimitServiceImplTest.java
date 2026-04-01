package com.neurobyte.ratelimiter.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.RateLimitCheckResult;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;
import com.neurobyte.ratelimiter.model.ScopeType;
import com.neurobyte.ratelimiter.service.impl.RateLimitServiceImpl;
import com.neurobyte.ratelimiter.strategy.RateLimitingStrategy;
import com.neurobyte.ratelimiter.strategy.RateLimitingStrategyFactory;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceImplTest {

    @Mock
    private RuleService ruleService;

    @Mock
    private RateLimitingStrategyFactory strategyFactory;

    @Mock
    private RateLimitingStrategy strategy;

    private RateLimitServiceImpl service;

    @BeforeEach
    void setup() {
        service = new RateLimitServiceImpl(ruleService, strategyFactory);
    }

    @Test
    void shouldAllowWhenNoMatchingRules() {
        when(ruleService.listRules()).thenReturn(List.of(disabledRule()));

        RateLimitCheckResult result = service.check(baseContext());

        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getAlgorithmUsed()).isEqualTo("NONE");
    }

    @Test
    void shouldBlockWhenAnyRuleBlocks() {
        RateLimitRule rule = enabledUserRule();
        when(ruleService.listRules()).thenReturn(List.of(rule));
        when(strategyFactory.getByAlgorithm(AlgorithmType.FIXED_WINDOW)).thenReturn(strategy);
        when(strategy.evaluate(any(), any())).thenReturn(
                RateLimitDecision.builder()
                        .ruleId(rule.getRuleId())
                        .algorithm("FIXED_WINDOW")
                        .allowed(false)
                        .remaining(0)
                        .retryAfterSeconds(5)
                        .message("blocked")
                        .build()
        );

        RateLimitCheckResult result = service.check(baseContext());

        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getRetryAfterSeconds()).isEqualTo(5);
    }

    @Test
    void shouldEvaluateMultipleScopes() {
        RateLimitRule userRule = enabledUserRule();
        RateLimitRule ipRule = RateLimitRule.builder()
                .ruleId("ip-rule")
                .algorithmType(AlgorithmType.FIXED_WINDOW)
                .limit(5)
                .windowSizeSeconds(60)
                .scopeType(ScopeType.IP)
                .identifierValue("10.0.0.1")
                .enabled(true)
                .build();

        when(ruleService.listRules()).thenReturn(List.of(userRule, ipRule));
        when(strategyFactory.getByAlgorithm(AlgorithmType.FIXED_WINDOW)).thenReturn(strategy);
        when(strategy.evaluate(any(), any())).thenReturn(
                RateLimitDecision.builder()
                        .ruleId("any")
                        .algorithm("FIXED_WINDOW")
                        .allowed(true)
                        .remaining(2)
                        .retryAfterSeconds(0)
                        .message("ok")
                        .build()
        );

        RateLimitCheckResult result = service.check(baseContext());

        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getAlgorithmUsed()).isEqualTo("MULTIPLE");
        assertThat(result.getDecisions()).hasSize(2);
    }

    private RequestContext baseContext() {
        return RequestContext.builder()
                .userId("user123")
                .ipAddress("10.0.0.1")
                .endpoint("/api/payments")
                .timestamp(Instant.now())
                .build();
    }

    private RateLimitRule enabledUserRule() {
        return RateLimitRule.builder()
                .ruleId("user-rule")
                .algorithmType(AlgorithmType.FIXED_WINDOW)
                .limit(2)
                .windowSizeSeconds(60)
                .scopeType(ScopeType.USER)
                .identifierValue("user123")
                .endpointPattern("/api/payments")
                .enabled(true)
                .build();
    }

    private RateLimitRule disabledRule() {
        return RateLimitRule.builder()
                .ruleId("disabled")
                .algorithmType(AlgorithmType.FIXED_WINDOW)
                .limit(1)
                .windowSizeSeconds(60)
                .scopeType(ScopeType.GLOBAL)
                .enabled(false)
                .build();
    }
}
