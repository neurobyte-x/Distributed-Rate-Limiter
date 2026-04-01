package com.neurobyte.ratelimiter.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurobyte.ratelimiter.model.RateLimitRule;

@Repository
public class RedisRateLimitRuleRepository implements RateLimitRuleRepository {

    private static final String RULES_HASH_KEY = "ratelimiter:rules";

    private final HashOperations<String, String, String> hashOps;
    private final ObjectMapper objectMapper;

    public RedisRateLimitRuleRepository(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.hashOps = redisTemplate.opsForHash();
        this.objectMapper = objectMapper;
    }

    @Override
    public RateLimitRule save(RateLimitRule rule) {
        hashOps.put(RULES_HASH_KEY, rule.getRuleId(), serialize(rule));
        return rule;
    }

    @Override
    public Optional<RateLimitRule> findById(String ruleId) {
        String raw = hashOps.get(RULES_HASH_KEY, ruleId);
        return Optional.ofNullable(raw).map(this::deserialize);
    }

    @Override
    public List<RateLimitRule> findAll() {
        Map<String, String> values = hashOps.entries(RULES_HASH_KEY);
        return values.values().stream().map(this::deserialize).toList();
    }

    @Override
    public void deleteById(String ruleId) {
        hashOps.delete(RULES_HASH_KEY, ruleId);
    }

    private String serialize(RateLimitRule rule) {
        try {
            return objectMapper.writeValueAsString(rule);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize rule", e);
        }
    }

    private RateLimitRule deserialize(String value) {
        try {
            return objectMapper.readValue(value, RateLimitRule.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize rule", e);
        }
    }
}
