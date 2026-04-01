package com.neurobyte.ratelimiter.strategy;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.neurobyte.ratelimiter.config.RedisIntegrationTestBase;
import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;
import com.neurobyte.ratelimiter.model.ScopeType;
import com.neurobyte.ratelimiter.strategy.impl.FixedWindowStrategy;

@SpringBootTest
class FixedWindowStrategyTest extends RedisIntegrationTestBase {

    @Autowired
    private FixedWindowStrategy strategy;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void clean() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    @Test
    void shouldAllowExactlyAtLimitAndBlockOverLimit() {
        RateLimitRule rule = baseRule();

        RequestContext context = RequestContext.builder()
                .userId("user123")
                .endpoint("/api/payments")
                .timestamp(Instant.parse("2026-01-01T00:00:05Z"))
                .build();

        RateLimitDecision first = strategy.evaluate(rule, context);
        RateLimitDecision second = strategy.evaluate(rule, context);
        RateLimitDecision third = strategy.evaluate(rule, context);

        assertThat(first.isAllowed()).isTrue();
        assertThat(second.isAllowed()).isTrue();
        assertThat(third.isAllowed()).isFalse();
        assertThat(third.getRetryAfterSeconds()).isGreaterThan(0);
    }

    @Test
    void shouldAllowAgainAfterWindowExpires() {
        RateLimitRule rule = baseRule();

        RequestContext atFirstWindow = RequestContext.builder()
                .userId("user123")
                .endpoint("/api/payments")
                .timestamp(Instant.parse("2026-01-01T00:00:05Z"))
                .build();

        RequestContext nextWindow = RequestContext.builder()
                .userId("user123")
                .endpoint("/api/payments")
                .timestamp(Instant.parse("2026-01-01T00:01:05Z"))
                .build();

        strategy.evaluate(rule, atFirstWindow);
        strategy.evaluate(rule, atFirstWindow);
        RateLimitDecision blocked = strategy.evaluate(rule, atFirstWindow);
        RateLimitDecision allowedAgain = strategy.evaluate(rule, nextWindow);

        assertThat(blocked.isAllowed()).isFalse();
        assertThat(allowedAgain.isAllowed()).isTrue();
    }

    private RateLimitRule baseRule() {
        return RateLimitRule.builder()
                .ruleId("fixed-window-rule")
                .algorithmType(AlgorithmType.FIXED_WINDOW)
                .limit(2)
                .windowSizeSeconds(60)
                .scopeType(ScopeType.USER)
                .identifierValue("user123")
                .endpointPattern("/api/payments")
                .enabled(true)
                .build();
    }
}
