package com.neurobyte.ratelimiter.strategy.impl;

import java.time.Instant;
import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import com.neurobyte.ratelimiter.model.AlgorithmType;
import com.neurobyte.ratelimiter.model.RateLimitDecision;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;
import com.neurobyte.ratelimiter.strategy.RateLimitingStrategy;
import com.neurobyte.ratelimiter.util.RateLimitKeyUtil;

@Component
public class FixedWindowStrategy implements RateLimitingStrategy {

    private static final RedisScript<Long> SCRIPT = RedisScript.of(
            "local current = redis.call('INCR', KEYS[1]); "
                    + "if current == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])); end; "
                    + "return current;",
            Long.class
    );

    private final StringRedisTemplate redisTemplate;

    public FixedWindowStrategy(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean supports(AlgorithmType algorithmType) {
        return algorithmType == AlgorithmType.FIXED_WINDOW;
    }

    @Override
    public RateLimitDecision evaluate(RateLimitRule rule, RequestContext context) {
        long nowSec = resolveTimestamp(context).getEpochSecond();
        long window = rule.getWindowSizeSeconds();
        long windowStart = nowSec - (nowSec % window);
        String key = RateLimitKeyUtil.keyPrefix(rule, context) + ":fw:" + windowStart;

        Long currentCount = redisTemplate.execute(SCRIPT, List.of(key), String.valueOf(window));
        long count = currentCount == null ? 0L : currentCount;
        boolean allowed = count <= rule.getLimit();
        long remaining = Math.max(0, rule.getLimit() - count);
        long retryAfterSeconds = allowed ? 0 : window - (nowSec % window);

        return RateLimitDecision.builder()
                .ruleId(rule.getRuleId())
                .algorithm(rule.getAlgorithmType().name())
                .allowed(allowed)
                .remaining(remaining)
                .retryAfterSeconds(retryAfterSeconds)
                .message(allowed ? "Allowed by fixed window" : "Blocked by fixed window")
                .build();
    }

    private Instant resolveTimestamp(RequestContext context) {
        return context.getTimestamp() == null ? Instant.now() : context.getTimestamp();
    }
}
