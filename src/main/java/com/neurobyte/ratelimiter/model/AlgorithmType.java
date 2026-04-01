package com.neurobyte.ratelimiter.model;

public enum AlgorithmType {
    FIXED_WINDOW,
    SLIDING_WINDOW_LOG,
    SLIDING_WINDOW_COUNTER,
    TOKEN_BUCKET
}
