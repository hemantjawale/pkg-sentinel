# Contributing to pkg-sentinel

First off, thank you for helping make the npm ecosystem more secure!

---

## Development Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Clone and Install
```bash
git clone https://github.com/pkg-sentinel/pkg-sentinel.git
cd pkg-sentinel
npm install
```

### 3. Build & Typecheck
We use `tsup` for compiling the project into ESM/CJS bundles:
```bash
npm run build
npm run typecheck
```

---

## Code Quality Standards

We enforce strict rules for formatting, linting, and types:
- **TypeScript**: Must compile in strict mode with no implicit `any` types.
- **Formatting**: Run `npm run format` to auto-format code using Prettier.
- **Linting**: Run `npm run lint` to evaluate code with ESLint 9.

---

## Adding AST Detectors

AST detectors are stored under `src/analyzers/install-scripts/detectors/`.

To write a new detector:
1. Implement the `IDetector` interface:
   ```typescript
   import type { IDetector, DetectorContext } from '../../interfaces.js';

   export class MyDetector implements IDetector {
     readonly name = 'my-detector';
     readonly description = 'Detects X behavior';

     getVisitors(ctx: DetectorContext): Record<string, any> {
       return {
         Identifier(path) {
           if (path.node.name === 'eval') {
             ctx.report({
               detector: this.name,
               type: 'eval-use',
               severity: 'critical',
               description: 'Uses eval',
             });
           }
         }
       };
     }
   }
   ```
2. Register your detector in `src/analyzers/install-scripts/detectors/index.ts`.

---

## Writing Tests

Every new feature, rule, or detector must have accompanying tests:
- Place unit tests under `tests/unit/`.
- Mock external network APIs (npm registry or GitHub) using the global Mock Service Worker (MSW) server configuration inside `tests/mocks/server.ts`.
- Run tests with `npm run test`.
- Check test coverage with `npm run test:coverage`. We target >80% code coverage.
