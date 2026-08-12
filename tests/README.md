# Tests

See [`docs/testing-strategy.md`](../docs/testing-strategy.md) and
[ADR-0006](../docs/adr/0006-testing-strategy.md).

| Path               | Layer                           |
| ------------------ | ------------------------------- |
| `src/**/*.test.ts` | Unit (colocated)                |
| `integration/`     | Handler ↔ Postgres (`app_test`) |
| `e2e/`             | Playwright journeys             |

Feature folders under `*/features/<name>/` document product behavior; keep a short
`README.md` next to the scenarios.
