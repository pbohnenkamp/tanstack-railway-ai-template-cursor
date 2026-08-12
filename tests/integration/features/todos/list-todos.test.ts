import { describe, expect, it } from 'vitest'

import { insertTodo, listTodos } from '#/lib/demo/todos.handlers'

describe('list todos', () => {
  it('returns an empty list when nothing has been inserted', async () => {
    // Given an empty todos table (reset in setup)
    // When listTodos runs
    const todos = await listTodos()

    // Then there are no rows
    expect(todos).toEqual([])
  })

  it('returns inserted todos newest first', async () => {
    // Given two persisted todos
    await insertTodo({ data: { title: 'Older' } })
    await insertTodo({ data: { title: 'Newer' } })

    // When listTodos runs
    const todos = await listTodos()

    // Then titles are newest-first
    expect(todos.map((todo) => todo.title)).toEqual(['Newer', 'Older'])
  })
})
