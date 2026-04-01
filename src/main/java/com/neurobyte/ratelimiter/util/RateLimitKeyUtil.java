package com.neurobyte.ratelimiter.util;

import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.model.RequestContext;
import com.neurobyte.ratelimiter.model.ScopeType;

public final class RateLimitKeyUtil {

    private RateLimitKeyUtil() {
    }

    public static String keyPrefix(RateLimitRule rule, RequestContext context) {
        String scopePart = switch (rule.getScopeType()) {
            case USER -> safe(context.getUserId());
            case IP -> safe(context.getIpAddress());
            case ENDPOINT -> safe(context.getEndpoint());
            case GLOBAL -> "all";
        };

        String endpointPart = rule.getEndpointPattern() == null ? "any" : sanitize(rule.getEndpointPattern());
        return "ratelimiter:runtime:" + rule.getRuleId() + ":" + scopeToken(rule.getScopeType()) + ":" + scopePart + ":" + endpointPart;
    }

    public static String sanitize(String value) {
        return value.replaceAll("[^a-zA-Z0-9:_\\-]", "_");
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "unknown" : sanitize(value);
    }

    private static String scopeToken(ScopeType scopeType) {
        return scopeType.name().toLowerCase();
    }
}
