import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal Chromium-only setup for real-browser QA (Phase 12). Deliberately does not
 * invent a second backend: `webServer` below runs the project's own `npm run dev`,
 * which is the same Vite dev server that mounts the real /api/*.ts handlers via
 * vite/apiDevPlugin.ts — so a Playwright-driven page gets the identical frontend +
 * API wiring a real user would, not a stripped-down static preview.
 *
 * Runs on a dedicated port (5183) rather than Vite's default 5173, so this never
 * collides with a developer's own already-running `npm run dev` on the usual port —
 * `reuseExistingServer` then only ever reuses a Playwright-started server on that same
 * dedicated port, never an unrelated one.
 */
const PORT = 5183
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './playwright-artifacts/test-results',
  fullyParallel: true,
  reporter: [['html', { outputFolder: './playwright-artifacts/report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
