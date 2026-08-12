import { describe, expect, it } from 'vitest'

import { createTodoSchema } from '#/lib/demo/todos.schemas'

describe('createTodoSchema', () => {
  it('accepts a non-empty title', () => {
    // Given a title with visible characters
    const input = { title: 'Buy milk' }

    // When the schema parses the input
    const result = createTodoSchema.safeParse(input)

    // Then validation succeeds with the same title
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Buy milk')
    }
  })

  it('rejects an empty title', () => {
    // Given an empty title
    const input = { title: '' }

    // When the schema parses the input
    const result = createTodoSchema.safeParse(input)

    // Then validation fails with the required-title message
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Title is required')
    }
  })
})
