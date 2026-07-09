# Architecture Documentation — pkg-sentinel

This document outlines the software design, package flow, and engines within `pkg-sentinel`.

---

## Architecture Design

`pkg-sentinel` is designed around **Clean Architecture** and **Interface-First Design**. Concrete implementation details (e.g. how data is fetched from the registry or how caches are written) are kept completely separate from the core analysis orchestrator and scoring engine.

```
       [ CLI / Commands ]
               │
               ▼
      [ Analysis Engine ] ◄─── [ Providers (Npm, GitHub) ]
        (Orchestrator)    ◄─── [ Cache Manager (Disk) ]
               │
               ├──────────────► [ AST Engine (Babel Parser) ]
               │
               ├──────────────► [ Rules Engine ]
               │
               └──────────────► [ Scoring Engine ]
                                       │
                                       ▼
                              [ Output / Report ]
```

---

## Core Components

### 1. Data Providers (`src/providers/`)
Data providers implement swappable interfaces to fetch package metadata:
- `NpmProvider`: Connects to `registry.npmjs.org` to fetch package version manifests and download `.tgz` tarball archives. It extracts files in-memory using `tar.Parser`.
- `GitHubProvider`: Fetches star counts, contributors list, commit history, and issue close rates.
- `CacheManager`: Backed by `FileCache` storing results locally as JSON files with separate Time-to-Live (TTL) configs for npm and GitHub data.

### 2. AST Parsing Engine (`src/analyzers/install-scripts/`)
Static code analysis avoids string matchers/regex where possible to prevent bypasses. Instead, it utilizes `@babel/parser` and `@babel/traverse` to construct an Abstract Syntax Tree (AST):
- Code from install scripts or inline node commands (extracted via `-e`/`--eval` string boundaries) is fed into the parser.
- Registered visitors traverse the AST to identify `process.env` lookups, filesystem writes, socket calls, credential accesses, child process executions, and obfuscated string entropy.

### 3. Rules Engine (`src/rules/`)
Evaluates deterministic conditions against data collected from the analyzers:
- Rules return structured `Finding` objects indicating rule IDs, severities, and concrete `Evidence` arrays pointing to specific files or code boundaries.
- Built-in rules identify stale repositories, missing provenance, publisher transfers, name similarity (typosquatting), and dangerous AST combinations (like file reads combined with outbound network requests).

### 4. Scoring Engine (`src/scoring/`)
Applies a weighted formula across 8 categories:
- Repository Health, Maintainer Trust, Supply Chain Integrity, Install Script Safety, Community Adoption, Package Maturity, Release Quality, and Risk Indicators.
- Category weights are configurable via `.pkg-sentinel.json` and are normalized to produce an overall Trust Score (0–100) mapped to a Trust Level (`trusted`, `moderate`, `low`, `untrusted`).
