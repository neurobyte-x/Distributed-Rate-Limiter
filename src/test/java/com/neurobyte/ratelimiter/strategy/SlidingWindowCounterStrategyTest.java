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
import com.neurobyte.ratelimiter.strategy.impl.SlidingWindowCounterStrategy;

@SpringBootTest
class SlidingWindowCounterStrategyTest extends RedisIntegrationTestBase {

    @Autowired
    private SlidingWindowCounterStrategy strategy;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void clean() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    @Test
    void shouldBlockWhenWeightedCountExceedsLimit() {
        RateLimitRule rule = baseRule();

        RequestContext first = context("2026-01-01T00:00:01Z");
        RequestContext second = context("2026-01-01T00:00:02Z");
        RequestContext third = context("2026-01-01T00:00:03Z");

        strategy.evaluate(rule, first);
        strategy.evaluate(rule, second);
        RateLimitDecision blocked = strategy.evaluate(rule, third);

        assertThat(blocked.isAllowed()).isFalse();
        assertThat(blocked.getRemaining()).isZero();
    }

    @Test
    void shouldAllowWhenWindowAdvancesEnough() {
        RateLimitRule rule = baseRule();

        strategy.evaluate(rule, context("2026-01-01T00:00:01Z"));
        strategy.evaluate(rule, context("2026-01-01T00:00:02Z"));
        RateLimitDecision allowedLater = strategy.evaluate(rule, context("2026-01-01T00:00:20Z"));

        assertThat(allowedLater.isAllowed()).isTrue();
    }

    private RequestContext context(String isoTime) {
        return RequestContext.builder()
                .endpoint("/api/orders")
                .timestamp(Instant.parse(isoTime))
                .build();
    }

    private RateLimitRule baseRule() {
        return RateLimitRule.builder()
                .ruleId("swc-rule")
                .algorithmType(AlgorithmType.SLIDING_WINDOW_COUNTER)
                .limit(2)
                .windowSizeSeconds(10)
                .scopeType(ScopeType.ENDPOINT)
                .identifierValue("/api/orders")
                .enabled(true)
                .build();
    }
}
