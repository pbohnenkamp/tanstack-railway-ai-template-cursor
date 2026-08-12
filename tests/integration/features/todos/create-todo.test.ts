import { describe, expect, it } from 'vitest'

import { insertTodo, listTodos } from '#/lib/demo/todos.handlers'

describe('create todo', () => {
  it('persists a title for later listing', async () => {
    // Given an empty todos table
    // When insertTodo is called with a valid title
    const result = await insertTodo({ data: { title: 'Ship testing scaffold' } })

    // Then the handler reports success and listTodos returns that row
    expect(result).toEqual({ success: true })
    const todos = await listTodos()
    expect(todos).toHaveLength(1)
    expect(todos[0]?.title).toBe('Ship testing scaffold')
  })
})
