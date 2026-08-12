import { expect, test } from '@playwright/test'

/**
 * Read-only checks against a deployed environment.
 * Do not mutate shared/stage/prod data here — use local e2e for write paths.
 */

test.describe('deployed smoke', () => {
  test('home page responds and shows the starter shell', async ({ page }) => {
    // Given a deployed app URL (SMOKE_BASE_URL)
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

    // When the home route loads
    expect(response?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/TanStack Start Starter/i)
    await expect(
      page.getByRole('heading', { name: /Start simple, ship quickly/i }),
    ).toBeVisible()
  })

  test('about page is reachable', async ({ page }) => {
    const response = await page.goto('/about', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.ok()).toBeTruthy()
    await expect(
      page.getByRole('heading', {
        name: /A small starter with room to grow/i,
      }),
    ).toBeVisible()
  })
})
