# Railway Infrastructure as Code

[`.railway/railway.ts`](./railway.ts) is the project graph for this template: a
`web` service (Nitro) and a `postgres` database, with `DATABASE_URL` wired and
`preDeploy` running `pnpm db:migrate` before traffic (ADR-0003).

Railway [config-as-code](https://docs.railway.com/config-as-code) (`railway.toml`)
is deprecated and stops being read on **2026-12-01**. Do not add it back.

## Apply is not a deploy

| Command                       | What it does                                           |
| ----------------------------- | ------------------------------------------------------ |
| `railway config plan`         | Diff this file against the **linked** environment      |
| `railway config apply`        | Create/update/delete services, databases, and settings |
| `railway up` / GitHub Actions | Ship a build of the app                                |

Code still deploys with `railway up` (see [`docs/ci-cd.md`](../docs/ci-cd.md)).
Apply once per environment when you bootstrap or change infrastructure.

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

If the service is still owned by a leftover `railway.toml`, migrate first so IaC
can manage it:

```bash
railway config migrate --apply --delete-files
railway config plan
railway config apply
```
