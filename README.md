# 🛡️ pkg-sentinel

> Production-quality npm supply-chain security and package trust analysis CLI tool.

`pkg-sentinel` parses, inspects, and scores npm packages *before* you run `npm install`. It runs AST-based static analysis on install scripts, measures repository health metrics, checks for typosquatting lookalikes, and tracks metadata mutations over time to ensure your development environment remains secure.

---

## Key Features

1. **AST-Based Static Analysis**: Inspects `preinstall`, `install`, and `postinstall` script structures using `@babel/parser` to locate sensitive file reads, outbound requests, credential theft, and code obfuscation.
2. **Deterministic Risk Rules**: Rules evaluated without AI. Explainable severities (`low`, `medium`, `high`, `critical`) identify clear risks.
3. **Repository Health Engine**: Computes bus factors, release frequency, commit cadence, and issue response times from GitHub and npm metadata.
4. **Weighted Trust Scores**: Configurable score categories (Maturity, Safety, Adoption, Health) normalized from 0 to 100.
5. **Dependency State Snapshotting**: Save a trusted dependency blueprint (`.json`) to monitor future updates for maintainer changes, version upgrades, or newly added lifecycle scripts.
6. **AI Risk Summary (Optional)**: Provides human-readable descriptions of flagged vulnerabilities without inventing evidence.

---

## Installation

```bash
npm install -g pkg-sentinel
```

*Note: Requires Node.js >= 18.0.0.*

---

## CLI Usage

### Diagnose Environment
Verify node compatibility, token configurations, and cache directory:
```bash
pkg-sentinel doctor
```

### Analyze a Single Package
Fetch and perform full security analysis on a specific package:
```bash
pkg-sentinel check chalk
pkg-sentinel check @babel/core@7.24.0
```

### Save Dependency Snapshot
Create a trusted record of your current project's dependencies:
```bash
pkg-sentinel snapshot --output .pkg-sentinel-snapshot.json
```

### Diff Against Snapshot
Compare current workspace packages against your saved baseline to detect changes:
```bash
pkg-sentinel diff --snapshot .pkg-sentinel-snapshot.json
```

---

## Configuration

You can customize `pkg-sentinel` by adding a `.pkg-sentinel.json` file in the root of your project:

```json
{
  "minSeverity": "info",
  "concurrency": 5,
  "scoring": {
    "weights": {
      "health": 20,
      "install-scripts": 30,
      "supply-chain": 30,
      "community": 20
    }
  },
  "disabledRules": [
    "supply-chain/no-provenance"
  ]
}
```

---

## Programmatic API

```typescript
import { AnalysisEngine, NpmProvider, TrustScorer, RuleEngine } from 'pkg-sentinel';

const npm = new NpmProvider();
const scorer = new TrustScorer();
const rules = new RuleEngine();

const engine = new AnalysisEngine(npm, undefined, scorer, rules);
const result = await engine.analyze('lodash');

console.log(`Trust Score: ${result.trustScore.overall}/100`);
```

---

## Security Policy

See [SECURITY.md](SECURITY.md) for vulnerability reporting instructions.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
