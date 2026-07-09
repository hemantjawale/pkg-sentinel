/**
 * Tests for the rule engine.
 */

import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../../../src/rules/rule-engine.js';
import { registerBuiltInRules } from '../../../src/rules/rule-registry.js';
import type { RuleEvaluationData } from '../../../src/rules/interfaces.js';

describe('RuleEngine', () => {
  it('registers and retrieves rules', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);

    const rules = engine.getRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('retrieves a rule by ID', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);

    const rule = engine.getRule('health/stale-repository');
    expect(rule).toBeDefined();
    expect(rule!.name).toBe('Stale Repository');
  });

  it('evaluates health rules — stale repository', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);

    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();

    const data: RuleEvaluationData = {
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      healthMetrics: {
        lastCommitDate: twoYearsAgo,
      },
    };

    const findings = engine.evaluate(data);
    const staleFindings = findings.filter((f) => f.ruleId === 'health/stale-repository');
    expect(staleFindings.length).toBeGreaterThan(0);
  });

  it('evaluates health rules — archived repository', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);

    const data: RuleEvaluationData = {
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      healthMetrics: {
        isArchived: true,
      },
    };

    const findings = engine.evaluate(data);
    const archivedFindings = findings.filter((f) => f.ruleId === 'health/archived-repository');
    expect(archivedFindings.length).toBe(1);
  });

  it('respects disabled rules', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);
    engine.disableRule('health/stale-repository');

    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();

    const data: RuleEvaluationData = {
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      healthMetrics: {
        lastCommitDate: twoYearsAgo,
      },
    };

    const findings = engine.evaluate(data);
    const staleFindings = findings.filter((f) => f.ruleId === 'health/stale-repository');
    expect(staleFindings).toHaveLength(0);
  });

  it('can re-enable disabled rules', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);
    engine.disableRule('health/archived-repository');
    engine.enableRule('health/archived-repository');

    const data: RuleEvaluationData = {
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      healthMetrics: { isArchived: true },
    };

    const findings = engine.evaluate(data);
    expect(findings.some((f) => f.ruleId === 'health/archived-repository')).toBe(true);
  });

  it('evaluates supply chain rules — no provenance', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);

    const data: RuleEvaluationData = {
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      supplyChainMetrics: { hasProvenance: false },
    };

    const findings = engine.evaluate(data);
    expect(findings.some((f) => f.ruleId === 'supply-chain/no-provenance')).toBe(true);
  });

  it('evaluates typosquatting rules', () => {
    const engine = new RuleEngine();
    registerBuiltInRules(engine);

    const data: RuleEvaluationData = {
      packageName: 'l0dash',
      packageVersion: '1.0.0',
      typosquatData: {
        typosquatResults: [
          { legitimatePackage: 'lodash', distance: 1, similarity: 0.83, patterns: [], confidence: 85 },
        ],
        brandImpersonation: [],
      },
    };

    const findings = engine.evaluate(data);
    expect(findings.some((f) => f.ruleId === 'typosquat/similar-name')).toBe(true);
  });
});
