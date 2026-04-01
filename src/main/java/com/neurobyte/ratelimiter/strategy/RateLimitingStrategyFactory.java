package com.neurobyte.ratelimiter.strategy;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.neurobyte.ratelimiter.model.AlgorithmType;

@Component
public class RateLimitingStrategyFactory {

    private final Map<AlgorithmType, RateLimitingStrategy> strategyByAlgorithm = new EnumMap<>(AlgorithmType.class);

    public RateLimitingStrategyFactory(List<RateLimitingStrategy> strategies) {
        for (RateLimitingStrategy strategy : strategies) {
            for (AlgorithmType type : AlgorithmType.values()) {
                if (strategy.supports(type)) {
                    strategyByAlgorithm.put(type, strategy);
                }
            }
        }
    }

    public RateLimitingStrategy getByAlgorithm(AlgorithmType algorithmType) {
        RateLimitingStrategy strategy = strategyByAlgorithm.get(algorithmType);
        if (strategy == null) {
            throw new IllegalArgumentException("No strategy registered for algorithm: " + algorithmType);
        }
        return strategy;
    }
}
