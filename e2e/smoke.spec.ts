import { test, expect } from '@playwright/test'

/**
 * Phase 12A preflight smoke test — proves a real Chromium instance can launch and
 * load this application before any further browser QA is attempted. Deliberately
 * targets /login: the one route that isn't behind RequireAuth (see src/App.tsx), so
 * this needs no session, no database write, and no credential of any kind.
 */
test('Chromium launches and loads the public login page without error', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page).toHaveTitle(/.*/)

  expect(pageErrors, `uncaught page exception(s): ${pageErrors.map((e) => e.message).join('; ')}`).toEqual([])

  await page.screenshot({ path: 'playwright-artifacts/smoke-login.png', fullPage: true })
})
