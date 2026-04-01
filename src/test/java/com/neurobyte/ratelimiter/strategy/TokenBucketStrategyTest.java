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
import com.neurobyte.ratelimiter.strategy.impl.TokenBucketStrategy;

@SpringBootTest
class TokenBucketStrategyTest extends RedisIntegrationTestBase {

    @Autowired
    private TokenBucketStrategy strategy;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void clean() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    @Test
    void shouldConsumeBurstAndBlockWhenEmpty() {
        RateLimitRule rule = baseRule();
        RequestContext t0 = context("2026-01-01T00:00:00Z");

        RateLimitDecision first = strategy.evaluate(rule, t0);
        RateLimitDecision second = strategy.evaluate(rule, t0);
        RateLimitDecision blocked = strategy.evaluate(rule, t0);

        assertThat(first.isAllowed()).isTrue();
        assertThat(second.isAllowed()).isTrue();
        assertThat(blocked.isAllowed()).isFalse();
    }

    @Test
    void shouldRefillOverTime() {
        RateLimitRule rule = baseRule();

        RequestContext t0 = context("2026-01-01T00:00:00Z");
        strategy.evaluate(rule, t0);
        strategy.evaluate(rule, t0);
        RateLimitDecision blocked = strategy.evaluate(rule, t0);

        RequestContext t2 = context("2026-01-01T00:00:02Z");
        RateLimitDecision allowedAfterRefill = strategy.evaluate(rule, t2);

        assertThat(blocked.isAllowed()).isFalse();
        assertThat(allowedAfterRefill.isAllowed()).isTrue();
    }

    private RequestContext context(String isoTime) {
        return RequestContext.builder()
                .userId("premium-user")
                .endpoint("/api/payments")
                .timestamp(Instant.parse(isoTime))
                .build();
    }

    private RateLimitRule baseRule() {
        return RateLimitRule.builder()
                .ruleId("tb-rule")
                .algorithmType(AlgorithmType.TOKEN_BUCKET)
                .limit(1)
                .windowSizeSeconds(1)
                .refillRatePerSecond(1.0)
                .burstCapacity(2L)
                .scopeType(ScopeType.USER)
                .identifierValue("premium-user")
                .endpointPattern("/api/payments")
                .enabled(true)
                .build();
    }
}
