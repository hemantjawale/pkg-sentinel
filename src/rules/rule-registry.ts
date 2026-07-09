/**
 * Rule registry — registers all built-in rules.
 */

import type { IRuleEngine } from './interfaces.js';
import { getHealthRules } from './built-in/health-rules.js';
import { getSupplyChainRules } from './built-in/supply-chain-rules.js';
import { getScriptRules } from './built-in/script-rules.js';
import { getTyposquatRules } from './built-in/typosquat-rules.js';

/**
 * Register all built-in rules with the rule engine.
 */
export function registerBuiltInRules(engine: IRuleEngine): void {
  const allRules = [
    ...getHealthRules(),
    ...getSupplyChainRules(),
    ...getScriptRules(),
    ...getTyposquatRules(),
  ];

  for (const rule of allRules) {
    engine.registerRule(rule);
  }
}
