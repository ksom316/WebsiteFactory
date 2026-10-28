import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../theme/ThemeProvider'
import { SettingsPage } from './SettingsPage'

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsPage', () => {
  it('selects dark theme and persists the preference', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>,
    )

    const darkOption = screen.getByRole('radio', { name: 'Dark' })
    await user.click(darkOption)

    expect(darkOption).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('wf-theme')).toBe('dark')
  })
})
