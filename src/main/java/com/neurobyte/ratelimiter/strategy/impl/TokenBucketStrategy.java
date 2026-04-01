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
public class TokenBucketStrategy implements RateLimitingStrategy {

    private static final RedisScript<List> SCRIPT = RedisScript.of(
            "local rate = tonumber(ARGV[1]); "
                    + "local capacity = tonumber(ARGV[2]); "
                    + "local requested = tonumber(ARGV[3]); "
                    + "local now = tonumber(ARGV[4]); "
                    + "local ttl = tonumber(ARGV[5]); "
                    + "local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens')); "
                    + "local last = tonumber(redis.call('HGET', KEYS[1], 'last')); "
                    + "if tokens == nil then tokens = capacity; end; "
                    + "if last == nil then last = now; end; "
                    + "local elapsed = math.max(0, now - last) / 1000.0; "
                    + "tokens = math.min(capacity, tokens + (elapsed * rate)); "
                    + "local allowed = 0; "
                    + "if tokens >= requested then tokens = tokens - requested; allowed = 1; end; "
                    + "redis.call('HSET', KEYS[1], 'tokens', tokens, 'last', now); "
                    + "redis.call('EXPIRE', KEYS[1], ttl); "
                    + "return {allowed, tokens};",
            List.class
    );

    private final StringRedisTemplate redisTemplate;

    public TokenBucketStrategy(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean supports(AlgorithmType algorithmType) {
        return algorithmType == AlgorithmType.TOKEN_BUCKET;
    }

    @Override
    public RateLimitDecision evaluate(RateLimitRule rule, RequestContext context) {
        Instant now = context.getTimestamp() == null ? Instant.now() : context.getTimestamp();
        long nowMillis = now.toEpochMilli();

        double refillRate = rule.getRefillRatePerSecond();
        long capacity = rule.getBurstCapacity();
        long requestedTokens = 1;
        long ttl = (long) Math.ceil((capacity / refillRate) * 2) + 60;

        String key = RateLimitKeyUtil.keyPrefix(rule, context) + ":tb";

        List<?> result = redisTemplate.execute(
                SCRIPT,
                List.of(key),
                String.valueOf(refillRate),
                String.valueOf(capacity),
                String.valueOf(requestedTokens),
                String.valueOf(nowMillis),
                String.valueOf(ttl)
        );

        long allowedFlag = number(result, 0);
        double remainingTokens = decimal(result, 1);
        boolean allowed = allowedFlag == 1;

        long remaining = (long) Math.floor(Math.max(0, remainingTokens));
        long retryAfterSeconds = 0;
        if (!allowed) {
            retryAfterSeconds = (long) Math.ceil((requestedTokens - remainingTokens) / refillRate);
            retryAfterSeconds = Math.max(1, retryAfterSeconds);
        }

        return RateLimitDecision.builder()
                .ruleId(rule.getRuleId())
                .algorithm(rule.getAlgorithmType().name())
                .allowed(allowed)
                .remaining(remaining)
                .retryAfterSeconds(retryAfterSeconds)
                .message(allowed ? "Allowed by token bucket" : "Blocked by token bucket")
                .build();
    }

    private long number(List<?> values, int index) {
        if (values == null || index >= values.size() || values.get(index) == null) {
            return 0;
        }
        return ((Number) values.get(index)).longValue();
    }

    private double decimal(List<?> values, int index) {
        if (values == null || index >= values.size() || values.get(index) == null) {
            return 0.0;
        }
        return ((Number) values.get(index)).doubleValue();
    }
}
