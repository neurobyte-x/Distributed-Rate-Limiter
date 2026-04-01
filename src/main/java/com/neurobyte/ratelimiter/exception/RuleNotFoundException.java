package com.neurobyte.ratelimiter.exception;

public class RuleNotFoundException extends RuntimeException {
    public RuleNotFoundException(String ruleId) {
        super("Rate limit rule not found: " + ruleId);
    }
}
