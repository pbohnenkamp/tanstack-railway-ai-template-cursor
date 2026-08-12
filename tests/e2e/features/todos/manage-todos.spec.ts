import { expect, test } from '@playwright/test'

test.describe('manage todos', () => {
  test('adds a todo from the drizzle demo page', async ({ page }) => {
    // Given the public drizzle demo (wait for hydration so the form handler is live)
    await page.goto('/demo/drizzle', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: 'Drizzle Demo' }),
    ).toBeVisible()

    const title = `e2e todo ${Date.now()}`
    const input = page.getByPlaceholder('Add a new todo...')
    await expect(input).toBeEnabled()

    // When the visitor submits a new todo
    await input.fill(title)
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('_serverFn') && response.ok(),
      ),
      page.getByRole('button', { name: 'Add Todo' }).click(),
    ])

    // Then the todo appears in the list
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 })
  })
})
