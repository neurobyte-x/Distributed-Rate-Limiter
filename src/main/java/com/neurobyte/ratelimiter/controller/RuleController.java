package com.neurobyte.ratelimiter.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neurobyte.ratelimiter.dto.request.RateLimitRuleUpsertRequest;
import com.neurobyte.ratelimiter.dto.response.RateLimitRuleResponse;
import com.neurobyte.ratelimiter.model.RateLimitRule;
import com.neurobyte.ratelimiter.service.RuleService;
import com.neurobyte.ratelimiter.util.DtoMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rules")
@Validated
public class RuleController {

    private final RuleService ruleService;

    public RuleController(RuleService ruleService) {
        this.ruleService = ruleService;
    }

    @PostMapping
    public ResponseEntity<RateLimitRuleResponse> createRule(@Valid @RequestBody RateLimitRuleUpsertRequest request) {
        RateLimitRule created = ruleService.createRule(DtoMapper.toModel(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(DtoMapper.toResponse(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RateLimitRuleResponse> updateRule(
            @PathVariable("id") String ruleId,
            @Valid @RequestBody RateLimitRuleUpsertRequest request
    ) {
        RateLimitRule updated = ruleService.updateRule(ruleId, DtoMapper.toModel(request));
        return ResponseEntity.ok(DtoMapper.toResponse(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RateLimitRuleResponse> getRule(@PathVariable("id") String ruleId) {
        return ResponseEntity.ok(DtoMapper.toResponse(ruleService.getRule(ruleId)));
    }

    @GetMapping
    public ResponseEntity<List<RateLimitRuleResponse>> listRules() {
        return ResponseEntity.ok(ruleService.listRules().stream().map(DtoMapper::toResponse).toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable("id") String ruleId) {
        ruleService.deleteRule(ruleId);
        return ResponseEntity.noContent().build();
    }
}
