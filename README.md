# rahulshettyacademy.com – Playwright + JavaScript Framework

```
config/        env + budgets          pages/      Page Objects
fixtures/      custom test fixtures   utils/      pure helpers (unit-tested)
tests/
  smoke/ sanity/ ui/ links/ edge/ performance/ security/
  unit/ integration/ e2e/ auth/ (login + registration)
scripts/       run-all.js, push-to-github.sh
```

## Setup
```bash
npm install
npm run install:browsers
cp .env.example .env      # optional overrides
```

## Run
| Command | What |
|---|---|
| `npm run test:all` | everything + per-suite summary (`results/summary.md`) |
| `npm run test:smoke` / `sanity` / `ui` / `links` / `edge` | single suites |
| `npm run test:performance` / `security` | non-functional |
| `npm run test:unit` | offline, no browser |
| `npm run test:integration` / `e2e` / `auth` | integration, end-to-end, login+registration |
| `npm run report` | open HTML report |
| `ALL_BROWSERS=true npm test` | add Firefox + WebKit |
| `npx playwright test --grep @smoke` | by tag |

## Notes
- Security tests are passive and non-destructive (headers, cookies, one-shot payloads). Only run against sites you are allowed to test.
- Registration tests create real accounts with unique `@example.com` emails on the practice site.
- Selectors for the practice pages (`/loginpagePractice`, `/angularpractice/shop`, `/client`) are centralised in `pages/` – fix them in one place if the site changes.
- Performance budgets are env-configurable (`PERF_*`).

## Publish
```bash
gh auth login && npm run push:github          # or:
GITHUB_USER=you GITHUB_TOKEN=ghp_xxx npm run push:github
```
