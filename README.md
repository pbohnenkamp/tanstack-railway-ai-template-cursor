Welcome to your new TanStack Start app!

# Getting Started

> **New app from this template?** Work through
> [`TEMPLATE_CHECKLIST.md`](./TEMPLATE_CHECKLIST.md) (Clerk, database, branding,
> demos). Clerk auth is bypassed until real keys are configured so you can
> explore the UI immediately.

To run this application:

```bash
pnpm install
cp .env.example .env.local   # DATABASE_URL already points at the local container
pnpm db:up                   # start Postgres (compose.yaml) and wait for health
pnpm db:setup                # apply migrations, then seed
pnpm dev
```

Requires a container runtime (`podman` or `docker`). The `db:up` / `db:down` /
`db:reset` scripts invoke `podman compose`; swap the binary if you use Docker.

`pnpm db:reset` destroys the local volume and rebuilds from `drizzle/` — local
data is disposable by design. Deployed environments set `DATABASE_URL` to their
managed Postgres (Railway for this template) and never use `compose.yaml`.
See [ADR-0003](./docs/adr/0003-schema-source-of-truth-and-migrations.md) and
[ADR-0004](./docs/adr/0004-postgres-with-drizzle.md).

# Building For Production

To build this application for production:

```bash
npm run build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) with
[shadcn/ui](https://ui.shadcn.com/) semantic color tokens in `src/styles.css`.
Style UI with the utilities those tokens back (`bg-primary`,
`text-muted-foreground`, `border`, …). Rebrand by editing `:root` / `.dark`
token values — do not add a second color palette.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

A Husky **pre-commit** hook runs `prettier --write .` and `eslint --fix`, and
**fails the commit** if either tool errors or reformats files (stage those
changes and commit again). This keeps local commits aligned with the CI lint job.

## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
pnpm build
pnpm start   # node .output/server/index.mjs
```

The build output is a self-contained Node server under `.output/`.

### Railway

[`railway.toml`](./railway.toml) runs `pnpm db:migrate` as `preDeployCommand` so
pending Drizzle migrations apply before the new container serves traffic. Provision
a Railway Postgres plugin/service, set `DATABASE_URL` on the app from that
service, and deploy. See [ADR-0003](./docs/adr/0003-schema-source-of-truth-and-migrations.md).

For trunk-based GitHub Actions CI/CD (lint, tests, CodeQL, auto-deploy `main`→`dev`,
manual promote to stage/production, post-deploy smoke), see
[`docs/ci-cd.md`](./docs/ci-cd.md) and [ADR-0007](./docs/adr/0007-ci-cd-trunk-based.md).
Complete [`TEMPLATE_CHECKLIST.md`](./TEMPLATE_CHECKLIST.md) §7 when bootstrapping a
new app.

For other host-specific presets and tuning, see https://v3.nitro.build/deploy.

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```

## Storybook

Component workshop for shadcn primitives and reusable UI. Stories are co-located
next to components (`src/components/ui/*.stories.tsx`). Preview uses the same
`src/styles.css` tokens as the app, with a light/dark toolbar.

```bash
pnpm storybook
pnpm build-storybook
pnpm test             # unit (schemas, authed, domain)
pnpm test:integration # handlers ↔ Postgres app_test (pnpm db:up first)
pnpm test:storybook   # interaction tests (see UI/Button → Clicked)
pnpm test:e2e         # Playwright journeys
pnpm test:smoke       # read-only checks against SMOKE_BASE_URL / APP_URL
# See docs/testing-strategy.md (ADR-0006) and docs/ci-cd.md (ADR-0007)
```

`UI/Button` includes example `play` tests (`Clicked`, `Disabled`). See
[docs/storybook-workflow.md](./docs/storybook-workflow.md) for conventions and
when to use Storybook vs unit/e2e tests.

## Setting up Clerk

> **Template mode:** If Clerk keys are missing or invalid, authentication is
> **bypassed** so you can navigate example pages immediately. The UI shows a
> **Clerk bypass** banner, and the server prints a **CRITICAL** warning.
> Complete [`TEMPLATE_CHECKLIST.md`](./TEMPLATE_CHECKLIST.md) (section 2) before
> shipping anything that depends on auth.

1. Create an application in the [Clerk dashboard](https://dashboard.clerk.com).
2. Copy its publishable and secret keys into `.env.local`:

   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. Restart the app and visit `/demo/clerk`.

### What's wired up

- `clerkMiddleware()` authenticates each server request from `src/start.ts`
  **only when both keys look valid**.
- `<ClerkProvider>` supplies auth state when configured; otherwise children
  render without Clerk.
- `<SignInButton>` and `<UserButton>` in the header respond to the session
  (or show a **Clerk off** chip while bypassed).
- `/demo/clerk` shows setup instructions when unconfigured, or Clerk's
  prebuilt sign-in UI when configured.
- Detection helpers live in `src/integrations/clerk/config.ts`.
- `authed` (`src/lib/server-auth.ts`) is the auth boundary for server functions
  that touch user data; `_authenticated` + `/sign-in` are UX only (ADR-0002).
- `/dashboard` is a signed-in scaffold under `_authenticated` (redirects until
  Clerk is configured and the visitor is signed in).

### Protecting routes and data

**Route guards are UX only.** `_authenticated` redirects signed-out visitors
during SSR so they never flash protected UI. That does **not** protect server
functions — those are RPC endpoints callable without matching a route.

**The security boundary is the data layer:**

1. Wrap handlers with `authed` from `src/lib/server-auth.ts` (non-null `userId`)
2. Constrain every query/mutation with that `userId`

```ts
// items.handlers.ts — plain function; wrap with authed for owned data
export const findItem = authed(
  async ({ data, userId }: { data: { id: number }; userId: string }) => {
    const rows = await db
      .select()
      .from(items)
      .where(and(eq(items.id, data.id), eq(items.userId, userId)))
      .limit(1)
    if (rows.length === 0) throw new Error('Not found')
    return rows[0]
  },
)

// items.ts — wiring only (ADR-0005)
export const getItem = createServerFn({ method: 'GET' })
  .validator(itemIdSchema)
  .handler(findItem)
```

See also [`docs/adr/0005-server-functions-as-data-access-layer.md`](./docs/adr/0005-server-functions-as-data-access-layer.md).

For signed-in **pages**, put routes under `src/routes/_authenticated/` (see
`src/routes/_authenticated.tsx`). Root `beforeLoad` fills `context.userId` via
`fetchSession`. Still use `authed` on every server function that touches user
data.

`<Show when="signed-in">` is presentation only. Full decision record:
[`docs/adr/0002-enforce-authorization-in-server-functions.md`](./docs/adr/0002-enforce-authorization-in-server-functions.md).
Clerk's [TanStack Start docs](https://clerk.com/docs/tanstack-react-start/getting-started/quickstart).

### Production checklist

- Follow [`TEMPLATE_CHECKLIST.md`](./TEMPLATE_CHECKLIST.md) end-to-end.
- Set both keys in the production environment; never expose `CLERK_SECRET_KEY`.
- Use production keys from a dedicated production Clerk instance.
- Configure the production domain and any social connections in the Clerk dashboard.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')

  useEffect(() => {
    getServerTime().then(setTime)
  }, [])

  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
