# Storybook workflow

Storybook is the **component workshop and UI regression surface** for apps built
from this template — not a second application.

Run it with:

```bash
pnpm storybook          # http://localhost:6006
pnpm build-storybook    # static build under storybook-static/
pnpm test:storybook     # run story interaction / a11y tests (Playwright)
```

First time only (browsers for Vitest browser mode):

```bash
pnpm exec playwright install chromium
```

## What belongs in Storybook

| In Storybook | Out of Storybook |
| --- | --- |
| `src/components/ui/*` (shadcn primitives) | Routes, loaders, server functions |
| Shared shell pieces as components (`ThemeToggle`, etc.) | Full Clerk / auth flows |
| Product UI extracted from routes | Multi-step app journeys (prefer e2e later) |

Demo routes under `src/routes/demo/**` stay optional living examples in the app;
prefer Storybook for reusable component states.

## Conventions

1. **Co-locate** stories next to the component:
   - `src/components/ui/button.tsx` → `button.stories.tsx`
   - Product composites: `src/components/foo/Bar.tsx` → `Bar.stories.tsx`
2. **Titles** follow folders: `UI/Button`, `Shell/ThemeToggle`, `Feature/…`.
3. Cover **product-relevant states** (default, disabled, invalid, loading,
   empty) — not every prop combination.
4. Use `tags: ['autodocs']` on design-system primitives.
5. Preview loads `src/styles.css` and a **light / dark** toolbar that toggles
   `html.dark`, matching app theme tokens. Do not invent a parallel palette.

## Day-to-day loop

1. Prefer an existing `#/components/ui/*` primitive; if missing,
   `pnpm dlx shadcn@latest add …` and add a co-located story.
2. Build and verify states in Storybook (light + dark).
3. Wire the component into a thin route only after the story looks right.
4. Mock callbacks with `fn()` from `storybook/test`. Avoid real Clerk,
   `createServerFn`, or live routers in stories — use props, stubs, or the
   TanStack React Storybook router helpers only when a composite truly needs
   them.

## Interaction tests (example)

Stories can include a `play` function. The Vitest addon turns those into
browser tests. See `Clicked` and `Disabled` on
`src/components/ui/button.stories.tsx`:

```tsx
import { expect, userEvent, within } from 'storybook/test'

export const Clicked: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Button' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
```

- Local UI: open the story → **Interactions** panel
- CI / CLI: `pnpm test:storybook` (project `storybook` in `vite.config.ts`)
- Keep `pnpm test` for fast node unit tests; do not mix the two runners

## Quality gates

| Layer | Use for |
| --- | --- |
| `pnpm test:storybook` (Vitest + Playwright via addon-vitest) | Render / interaction / a11y on components |
| `pnpm test` (unit Vitest) | Pure logic, validators, `authed` boundary |
| `pnpm test:integration` | Handlers ↔ Postgres (`app_test`) |
| `pnpm test:e2e` (Playwright) | Auth, navigation, multi-step app journeys |

Full pyramid, DB isolation, and workflows: [`docs/testing-strategy.md`](./testing-strategy.md)
(ADR-0006).

Accessibility addon is configured with `a11y.test: 'todo'` in
`.storybook/preview.tsx`. Flip to `'error'` when primitives are stable enough
to gate CI. Chromatic is available via `@chromatic-com/storybook` when you want
visual diffs on PRs — optional for early forks.

## Agent / MCP note

`@storybook/addon-mcp` helps agents discover existing stories before inventing
UI. Prefer extending story coverage when changing variants; do not duplicate
shadcn primitives.
