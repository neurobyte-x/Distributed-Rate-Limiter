package com.neurobyte.ratelimiter.strategy.impl;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

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
public class SlidingWindowLogStrategy implements RateLimitingStrategy {

    private static final RedisScript<List> SCRIPT = RedisScript.of(
            "redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, tonumber(ARGV[1]) - tonumber(ARGV[2])); "
                    + "local count = redis.call('ZCARD', KEYS[1]); "
                    + "if count < tonumber(ARGV[3]) then "
                    + "  redis.call('ZADD', KEYS[1], tonumber(ARGV[1]), ARGV[4]); "
                    + "  redis.call('EXPIRE', KEYS[1], math.ceil(tonumber(ARGV[2]) / 1000)); "
                    + "  return {1, count + 1, -1}; "
                    + "else "
                    + "  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES'); "
                    + "  local oldestScore = 0; "
                    + "  if oldest[2] then oldestScore = tonumber(oldest[2]); end; "
                    + "  return {0, count, oldestScore}; "
                    + "end;",
            List.class
    );

    private final StringRedisTemplate redisTemplate;

    public SlidingWindowLogStrategy(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean supports(AlgorithmType algorithmType) {
        return algorithmType == AlgorithmType.SLIDING_WINDOW_LOG;
    }

    @Override
    public RateLimitDecision evaluate(RateLimitRule rule, RequestContext context) {
        Instant now = context.getTimestamp() == null ? Instant.now() : context.getTimestamp();
        long nowMillis = now.toEpochMilli();
        long windowMillis = rule.getWindowSizeSeconds() * 1000;
        String key = RateLimitKeyUtil.keyPrefix(rule, context) + ":swl";

        List<?> result = redisTemplate.execute(
                SCRIPT,
                List.of(key),
                String.valueOf(nowMillis),
                String.valueOf(windowMillis),
                String.valueOf(rule.getLimit()),
                UUID.randomUUID().toString()
        );

        long allowedFlag = number(result, 0);
        long count = number(result, 1);
        long oldestScore = number(result, 2);

        boolean allowed = allowedFlag == 1;
        long remaining = Math.max(0, rule.getLimit() - count);
        long retryAfterSeconds = 0;
        if (!allowed && oldestScore > 0) {
            retryAfterSeconds = Math.max(1, (oldestScore + windowMillis - nowMillis + 999) / 1000);
        }

        return RateLimitDecision.builder()
                .ruleId(rule.getRuleId())
                .algorithm(rule.getAlgorithmType().name())
                .allowed(allowed)
                .remaining(remaining)
                .retryAfterSeconds(retryAfterSeconds)
                .message(allowed ? "Allowed by sliding window log" : "Blocked by sliding window log")
                .build();
    }

    private long number(List<?> values, int index) {
        if (values == null || index >= values.size() || values.get(index) == null) {
            return 0;
        }
        return ((Number) values.get(index)).longValue();
    }
}
