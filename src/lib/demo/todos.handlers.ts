import { desc } from 'drizzle-orm'
import { db } from '#/db/index'
import { todos } from '#/db/schema'
import type { CreateTodoInput } from '#/lib/demo/todos.schemas'

/**
 * Public drizzle-demo data access (intentionally no owner column / no `authed`).
 * Product resources must wrap handlers in `authed` and scope by `userId` —
 * see ADR-0002. Module split is ADR-0005: these plain functions are what tests
 * (and `todos.ts` wiring) call; a `createServerFn` result cannot be invoked
 * outside the Start runtime.
 */
export async function listTodos() {
  return await db.query.todos.findMany({
    orderBy: [desc(todos.createdAt)],
  })
}

export async function insertTodo({ data }: { data: CreateTodoInput }) {
  await db.insert(todos).values({ title: data.title })
  return { success: true as const }
}
