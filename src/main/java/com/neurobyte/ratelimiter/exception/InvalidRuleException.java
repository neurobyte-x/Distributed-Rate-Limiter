package com.neurobyte.ratelimiter.exception;

public class InvalidRuleException extends RuntimeException {
    public InvalidRuleException(String message) {
        super(message);
    }
}
