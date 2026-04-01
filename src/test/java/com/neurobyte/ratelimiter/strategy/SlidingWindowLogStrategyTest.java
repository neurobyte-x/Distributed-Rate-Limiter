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
import com.neurobyte.ratelimiter.strategy.impl.SlidingWindowLogStrategy;

@SpringBootTest
class SlidingWindowLogStrategyTest extends RedisIntegrationTestBase {

    @Autowired
    private SlidingWindowLogStrategy strategy;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void clean() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    @Test
    void shouldBlockWhenRequestsExceedLimitWithinWindow() {
        RateLimitRule rule = baseRule();

        RequestContext t0 = context("2026-01-01T00:00:00Z");
        RequestContext t1 = context("2026-01-01T00:00:01Z");
        RequestContext t2 = context("2026-01-01T00:00:02Z");

        strategy.evaluate(rule, t0);
        strategy.evaluate(rule, t1);
        RateLimitDecision blocked = strategy.evaluate(rule, t2);

        assertThat(blocked.isAllowed()).isFalse();
        assertThat(blocked.getRetryAfterSeconds()).isGreaterThan(0);
    }

    @Test
    void shouldAllowAfterOldEntriesLeaveWindow() {
        RateLimitRule rule = baseRule();

        strategy.evaluate(rule, context("2026-01-01T00:00:00Z"));
        strategy.evaluate(rule, context("2026-01-01T00:00:01Z"));

        RateLimitDecision allowed = strategy.evaluate(rule, context("2026-01-01T00:00:11Z"));
        assertThat(allowed.isAllowed()).isTrue();
    }

    private RequestContext context(String isoTime) {
        return RequestContext.builder()
                .ipAddress("192.168.1.10")
                .endpoint("/api/login")
                .timestamp(Instant.parse(isoTime))
                .build();
    }

    private RateLimitRule baseRule() {
        return RateLimitRule.builder()
                .ruleId("sliding-log-rule")
                .algorithmType(AlgorithmType.SLIDING_WINDOW_LOG)
                .limit(2)
                .windowSizeSeconds(10)
                .scopeType(ScopeType.IP)
                .identifierValue("192.168.1.10")
                .endpointPattern("/api/login")
                .enabled(true)
                .build();
    }
}
