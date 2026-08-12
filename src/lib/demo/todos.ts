import { createServerFn } from '@tanstack/react-start'
import { insertTodo, listTodos } from '#/lib/demo/todos.handlers'
import { createTodoSchema } from '#/lib/demo/todos.schemas'

/**
 * RPC surface for the public drizzle demo. Wiring only — method, validator,
 * handler. See ADR-0005.
 */
export const getTodos = createServerFn({ method: 'GET' }).handler(listTodos)

export const createTodo = createServerFn({ method: 'POST' })
  .validator(createTodoSchema)
  .handler(insertTodo)
