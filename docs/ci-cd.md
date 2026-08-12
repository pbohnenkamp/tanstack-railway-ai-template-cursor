# CI/CD (GitHub Actions + Railway)

Trunk-based delivery for this template. See [ADR-0007](./adr/0007-ci-cd-trunk-based.md).

## Model

- Feature work happens on short-lived branches off `main`.
- Every push and every PR to `main` runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
- Merges to `main` require the aggregator status check named **`CI`** (configure branch protection).
- Merge / push to `main` auto-deploys **dev** via [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
- **stage** and **production** deploys are manual (`workflow_dispatch`) and must follow
  `dev` → `stage` → `production` for the same git SHA.
- A feature branch may be manually deployed to shared **dev** only if that commit’s CI
  run succeeded. That deploy **overwrites** whatever is currently on `dev`.

```text
feature branch ──CI──► PR ──CI──► main ──auto──► Railway dev ──smoke──►
                                              │
                         workflow_dispatch ───┼──► stage ──smoke──►
                                              └──► production ──smoke──►
```

## CI jobs

| Job                                  | Command / tool                                 |
| ------------------------------------ | ---------------------------------------------- |
| Lint                                 | `pnpm check`, `pnpm lint`                      |
| Typecheck                            | `pnpm typecheck`                               |
| Build                                | `pnpm build`                                   |
| Unit / Integration / Storybook / E2E | existing Vitest + Playwright suites            |
| CodeQL                               | `github/codeql-action` (javascript-typescript) |
| **CI**                               | Aggregator — require this check on `main`      |

## Deploy workflow

### Automatic

Push to `main` → deploy GitHub Environment `dev` → smoke tests against `APP_URL`.

### Manual

Actions → **Deploy** → Run workflow:

| Input        | Allowed refs | Prior env required                                  |
| ------------ | ------------ | --------------------------------------------------- |
| `dev`        | any branch   | none (CI green required)                            |
| `stage`      | `main` only  | successful GitHub Deployment of this SHA to `dev`   |
| `production` | `main` only  | successful GitHub Deployment of this SHA to `stage` |

Railway apply happens with:

```bash
railway up --ci \
  --project "$RAILWAY_PROJECT_ID" \
  --service "$RAILWAY_SERVICE_ID" \
  --environment "$RAILWAY_ENVIRONMENT_ID"
```

[`railway.toml`](../railway.toml) still runs `pnpm db:migrate` as `preDeployCommand`.

## GitHub Environments and secrets

Create Environments named exactly: `dev`, `stage`, `production`.

For **each** environment, set:

| Name                     | Type     | Purpose                                                           |
| ------------------------ | -------- | ----------------------------------------------------------------- |
| `RAILWAY_TOKEN`          | secret   | Railway project/account token for CLI                             |
| `RAILWAY_PROJECT_ID`     | variable | Railway project id                                                |
| `RAILWAY_SERVICE_ID`     | variable | App service id (or name)                                          |
| `RAILWAY_ENVIRONMENT_ID` | variable | Railway environment id (or name)                                  |
| `APP_URL`                | variable | Public base URL for smoke tests (e.g. `https://….up.railway.app`) |

Recommended protection:

- `stage`: required reviewers
- `production`: required reviewers (+ optional wait timer)

App runtime secrets (`DATABASE_URL`, Clerk keys, …) live on **Railway**, not in GitHub,
except the deploy credentials above.

## Branch protection (`main`)

In the GitHub repo settings (or via API):

1. Require a pull request before merging
2. Require status checks to pass — select **`CI`**
3. Require branches to be up to date before merging (recommended)
4. Dismiss stale pull request approvals when new commits are pushed
5. For production apps, disable admin bypass of these rules

Example with `gh` (adjust owner/repo; run after `CI` has appeared at least once):

```bash
gh api \
  --method PUT \
  "repos/OWNER/REPO/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

## Smoke tests

```bash
SMOKE_BASE_URL=https://your-dev-url.example pnpm test:smoke
```

Suite: [`tests/smoke/`](../tests/smoke/) — read-only. Do not point mutating e2e at shared
hosted databases.

## First-time Railway layout

1. One Railway **project**
2. Three Railway **environments**: `dev`, `stage`, `production` (names can differ if
   `RAILWAY_ENVIRONMENT_ID` matches)
3. App service + Postgres in each environment (or shared patterns you prefer); set
   `DATABASE_URL` and Clerk keys per environment
4. Generate a public domain per environment and copy it into GitHub `APP_URL`
5. Create a Railway token and store it as `RAILWAY_TOKEN` on each GitHub Environment
