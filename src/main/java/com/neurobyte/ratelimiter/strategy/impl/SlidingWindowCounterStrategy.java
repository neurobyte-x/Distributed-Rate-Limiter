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
public class SlidingWindowCounterStrategy implements RateLimitingStrategy {

    private static final long SCALE = 1_000_000L;

    private static final RedisScript<List> SCRIPT = RedisScript.of(
            "local curr = tonumber(redis.call('GET', KEYS[1]) or '0'); "
                    + "local prev = tonumber(redis.call('GET', KEYS[2]) or '0'); "
                    + "local weightedPrev = math.floor((prev * tonumber(ARGV[2])) / tonumber(ARGV[3])); "
                    + "local effective = curr + weightedPrev; "
                    + "if effective >= tonumber(ARGV[1]) then "
                    + "  return {0, curr, prev, effective}; "
                    + "end; "
                    + "curr = redis.call('INCR', KEYS[1]); "
                    + "if curr == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4])); end; "
                    + "effective = curr + weightedPrev; "
                    + "return {1, curr, prev, effective};",
            List.class
    );

    private final StringRedisTemplate redisTemplate;

    public SlidingWindowCounterStrategy(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean supports(AlgorithmType algorithmType) {
        return algorithmType == AlgorithmType.SLIDING_WINDOW_COUNTER;
    }

    @Override
    public RateLimitDecision evaluate(RateLimitRule rule, RequestContext context) {
        Instant now = context.getTimestamp() == null ? Instant.now() : context.getTimestamp();
        long nowSec = now.getEpochSecond();
        long windowSec = rule.getWindowSizeSeconds();

        long currentWindow = nowSec / windowSec;
        long currentWindowStart = currentWindow * windowSec;
        long previousWindowStart = currentWindowStart - windowSec;

        long elapsedInWindow = nowSec - currentWindowStart;
        long weightScaled = Math.max(0, ((windowSec - elapsedInWindow) * SCALE) / windowSec);

        String prefix = RateLimitKeyUtil.keyPrefix(rule, context) + ":swc";
        String currentKey = prefix + ":" + currentWindowStart;
        String previousKey = prefix + ":" + previousWindowStart;
        long ttlSeconds = windowSec * 2;

        List<?> result = redisTemplate.execute(
                SCRIPT,
                List.of(currentKey, previousKey),
                String.valueOf(rule.getLimit()),
                String.valueOf(weightScaled),
                String.valueOf(SCALE),
                String.valueOf(ttlSeconds)
        );

        long allowedFlag = number(result, 0);
        long effective = number(result, 3);
        boolean allowed = allowedFlag == 1;

        long remaining = Math.max(0, rule.getLimit() - effective);
        long retryAfterSeconds = allowed ? 0 : Math.max(1, windowSec - elapsedInWindow);

        return RateLimitDecision.builder()
                .ruleId(rule.getRuleId())
                .algorithm(rule.getAlgorithmType().name())
                .allowed(allowed)
                .remaining(remaining)
                .retryAfterSeconds(retryAfterSeconds)
                .message(allowed ? "Allowed by sliding window counter" : "Blocked by sliding window counter")
                .build();
    }

    private long number(List<?> values, int index) {
        if (values == null || index >= values.size() || values.get(index) == null) {
            return 0;
        }
        return ((Number) values.get(index)).longValue();
    }
}
