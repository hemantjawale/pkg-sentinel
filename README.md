# 🛡️ pkg-sentinel

[![CI Status](https://github.com/hemantjawale/pkg-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/hemantjawale/pkg-sentinel/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%23007acc.svg)](https://www.typescriptlang.org/)
[![Node.js Compatibility](https://img.shields.io/badge/node-%3E%3D%2018.0.0-green.svg)](https://nodejs.org/)

> **pkg-sentinel** is a production-grade, open-source supply-chain security command-line tool and programmatic library. It helps developers determine package trustworthiness, run static analysis checks on lifecycle scripts, detect typosquatting lookalikes, and safeguard systems *before* invoking `npm install`.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [Architectural Overview](#-architectural-overview)
3. [Installation & Setup](#-installation--setup)
4. [Command Reference](#-command-reference)
5. [Configuration Schema](#-configuration-schema)
6. [Programmatic Library API](#-programmatic-library-api)
7. [Documentation Directory](#-documentation-directory)
8. [Vulnerability Disclosure & Security](#-vulnerability-disclosure--security)
9. [Contributing Guidelines](#-contributing-guidelines)
10. [License](#-license)

---

## ⚡ Core Features

*   **🔍 AST-Based Lifecycle Parser**: Uses `@babel/parser` and `@babel/traverse` to parse install script structures in-memory. Detects hidden filesystem reads, outbound network requests, credential leaks, and code obfuscations.
*   **⚖️ Configurable Scoring Engine**: Normalizes and weights scores across 8 trust dimensions (Safety, Health, Maturity, Adoption, etc.) from `0` to `100`.
*   **🛡️ Explainable Rules Engine**: Rules are deterministic, reproducible, and explainable. No AI is used in the security-flagging workflow.
*   **📊 Dependency Blueprinting (Snapshots)**: Snapshots dependency trees into a local `.json` layout to monitor updates for unauthorized publisher transfers, maintainer changes, or added scripts.
*   **📡 Resilience Features**: Implements native backoff retry strategies, HTTP connection timeouts, and persistent filesystem TTL caches for registry data.
*   **🤖 AI Explainer (Optional)**: Post-analysis AI prompts summarize deterministic findings using OpenAI/Anthropic APIs under strict anti-hallucination guardrails.

---

## 🏗️ Architectural Overview

`pkg-sentinel` is designed around **Clean Architecture** and **Dependency Injection**. The analysis engine behaves as a pipeline orchestrator executing decoupled analyzers and consolidating findings:

```
                  ┌──────────────────────────────┐
                  │    cli.js / Library entry    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  AnalysisEngine (Pipeline)   │◄─── [ Cache Manager ]
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  AST Analyzer    │    │  Health Engine   │    │  Typosquat Engine│
│ (Babel Traversal)│    │  (GitHub/npm)    │    │  (Levenshtein)   │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     Rules Engine (Eval)      │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Scoring Engine (0-100)    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Reporters (JSON/HTML/MD/CI) │
                  └──────────────────────────────┘
```

---

## ⚙️ Installation & Setup

### Requirements
- **Node.js**: `>= 18.0.0`
- **Package Manager**: `npm` or `yarn` / `pnpm`

### Global Installation
Install the CLI utility globally on your machine:
```bash
npm install -g pkg-sentinel
```

### Local Project Setup
To run tests and compile from source:
```bash
# Clone the repository
git clone https://github.com/hemantjawale/pkg-sentinel.git
cd pkg-sentinel

# Install package dependencies
npm install

# Compile TypeScript using tsup
npm run build

# Run unit and integration tests
npm run test
```

---

## 💻 Command Reference

All CLI routines can be invoked using `pkg-sentinel <command>`. (Or `node dist/cli.js <command>` when running from source).

### 🏥 `doctor`
Diagnoses the runtime environment, active configuration rules, API tokens, and local cache metadata:
```bash
pkg-sentinel doctor
```

### 🔍 `check <package>`
Fetches and runs a full trust audit on a package:
```bash
# Audits latest version of chalk
pkg-sentinel check chalk

# Audits a scoped package version
pkg-sentinel check @babel/core@7.24.0

# Outputs the report in machine-readable JSON format
pkg-sentinel check lodash --json
```

### 📸 `snapshot`
Saves a trusted dependency snapshot of all packages in `package.json`:
```bash
pkg-sentinel snapshot --output .pkg-sentinel-snapshot.json
```

### 🔄 `diff`
Compares current workspace dependencies against a saved snapshot to spot transfers, updates, or added lifecycle scripts:
```bash
pkg-sentinel diff --snapshot .pkg-sentinel-snapshot.json
```

---

## 🛠️ Configuration Schema

Configure global analyzer variables using a `.pkg-sentinel.json` file in your project root:

```json
{
  "minSeverity": "info",
  "concurrency": 5,
  "cache": {
    "enabled": true,
    "npmTtlSeconds": 900,
    "githubTtlSeconds": 3600
  },
  "scoring": {
    "weights": {
      "health": 15,
      "maintainer-trust": 15,
      "supply-chain": 20,
      "install-scripts": 20,
      "community": 10,
      "package-age": 5,
      "release-quality": 10,
      "risk-indicators": 5
    }
  },
  "disabledRules": [
    "supply-chain/no-provenance"
  ]
}
```

---

## 📦 Programmatic Library API

You can import `pkg-sentinel` directly into your Node.js scripts:

```typescript
import { 
  AnalysisEngine, 
  NpmProvider, 
  GitHubProvider, 
  TrustScorer, 
  RuleEngine,
  registerBuiltInRules 
} from 'pkg-sentinel';

// Initialize data providers
const npm = new NpmProvider();
const github = new GitHubProvider({ token: process.env.GITHUB_TOKEN });

// Wire scoring and rules logic
const scorer = new TrustScorer();
const rules = new RuleEngine();
registerBuiltInRules(rules);

// Run the analysis engine
const engine = new AnalysisEngine(npm, github, scorer, rules);
const result = await engine.analyze('lodash');

console.log(`Overall Trust: ${result.trustScore.overall}/100`);
console.log(`Severity Risk Level: ${result.highestSeverity}`);
```

---

## 📂 Documentation Directory

Detailed design specs and development guides are located under the `docs/` directory:

- [Architecture Design Spec](docs/architecture.md): Deep dive into pipeline executions, caching layouts, AST collectors, and orchestration flowcharts.
- [Contributing Guide](docs/contributing.md): Setup procedures, testing rules, coding styles, and instructions for adding AST detectors.

---

## 🔒 Vulnerability Disclosure & Security

If you discover a security vulnerability in `pkg-sentinel`, please **do not open a public issue**. Instead, follow the responsible disclosure guidelines documented in [SECURITY.md](SECURITY.md) to report it privately.

---

## 🤝 Contributing Guidelines

We welcome pull requests and code modifications! Please review the [Contributing Guide](docs/contributing.md) to align on coding standards, vitest test coverage thresholds, and formatting checks before submitting a PR.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for complete details.
