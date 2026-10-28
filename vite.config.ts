/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { apiDevPlugin } from './vite/apiDevPlugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Playwright owns everything under e2e/ (see playwright.config.ts) — those specs
    // import `@playwright/test`'s own `test`/`expect`, which Vitest's runner can't
    // execute, so they must never be picked up by Vitest's default *.spec.ts matcher.
    // Extends (not replaces) Vitest's own default exclude list.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'e2e/**',
    ],
  },
})
