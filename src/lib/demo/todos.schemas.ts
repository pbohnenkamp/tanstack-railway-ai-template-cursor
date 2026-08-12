import { z } from 'zod'

/**
 * Input contracts for the public drizzle demo todos.
 * Bound via `createServerFn().validator()` in `todos.ts` so validation runs
 * before any handler. Kept out of handlers so validating a shape never opens
 * a Postgres connection (see ADR-0005).
 */
export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
