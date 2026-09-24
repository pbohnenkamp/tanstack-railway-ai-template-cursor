# Railway Infrastructure as Code

[`.railway/railway.ts`](./railway.ts) is the project graph for this template: a
`web` service (Nitro) and a `postgres` database, with `DATABASE_URL` wired and
`preDeploy` running `pnpm db:migrate` before traffic (ADR-0003).

## Infrastructure and application deploys

Applying this file and shipping the app are separate processes.

| Command                | What it does                                                | When                                                                     |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `railway config plan`  | Diff this file against the **linked** environment           | Before every apply                                                       |
| `railway config apply` | Create, update, or delete services, databases, and settings | Bootstrap, and again only when this file changes. A manual CLI step      |
| `railway up`           | Ship a build of the app                                     | Every release, from GitHub Actions ([`docs/ci-cd.md`](../docs/ci-cd.md)) |

`railway config apply` writes settings onto the services, including `preDeploy`
(`pnpm db:migrate`). Each `railway up` then runs that command before the new
container serves traffic. The deploy workflow leaves the project graph as last
applied.

Requires Railway CLI **5.42.1+**. Railpack is the default builder; Node 22 comes
from [`.node-version`](../.node-version) and `package.json` `engines.node`.

```bash
railway login
railway link
railway config plan
railway config apply
```

Repeat `plan` / `apply` for `dev`, `stage`, and `production` (link or select
each environment). Clerk keys stay on the `web` service in the dashboard — not
in this file.

## Existing Railway projects

This file describes a **new** app: services named `web` and `postgres`. Applying
it against a project that already has differently named services will create
those two and **delete** anything omitted.

If the project already exists:

```bash
railway config pull --force
```

Then copy `build` / `start` / `preDeploy` / healthcheck / restart settings from
this template into the pulled file, keep the live service names, and apply.
