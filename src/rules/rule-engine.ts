/**
 * Rule engine — evaluates deterministic rules against analysis data.
 */

import type { IRuleEngine, IRule, RuleEvaluationData } from './interfaces.js';
import type { Finding } from '../types/analysis.js';

export class RuleEngine implements IRuleEngine {
  private readonly rules = new Map<string, IRule>();
  private readonly disabledRules = new Set<string>();

  evaluate(data: RuleEvaluationData): Finding[] {
    const findings: Finding[] = [];

    for (const [id, rule] of this.rules) {
      if (this.disabledRules.has(id)) continue;

      try {
        const ruleFindings = rule.evaluate(data);
        findings.push(...ruleFindings);
      } catch {
        // Don't let one rule failure stop others
      }
    }

    return findings;
  }

  registerRule(rule: IRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule "${rule.id}" is already registered`);
    }
    this.rules.set(rule.id, rule);
  }

  getRules(): IRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): IRule | undefined {
    return this.rules.get(id);
  }

  disableRule(id: string): void {
    this.disabledRules.add(id);
  }

  enableRule(id: string): void {
    this.disabledRules.delete(id);
  }
}
