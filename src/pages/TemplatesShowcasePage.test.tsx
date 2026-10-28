import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TemplatesShowcasePage } from './TemplatesShowcasePage'

describe('TemplatesShowcasePage', () => {
  it('defaults to the premium variant and the first sample profile', () => {
    render(<TemplatesShowcasePage />)
    const frame = screen.getByTitle('Template preview') as HTMLIFrameElement
    expect(frame.src).toContain('variant=premium')
    expect(frame.src).toContain('profile=fathom')
  })

  it('updates the preview src when switching variant', async () => {
    const user = userEvent.setup()
    render(<TemplatesShowcasePage />)
    await user.click(screen.getByRole('radio', { name: 'Neutral Business' }))
    const frame = screen.getByTitle('Template preview') as HTMLIFrameElement
    expect(frame.src).toContain('variant=neutral')
  })

  it('updates the preview src when switching sample profile', async () => {
    const user = userEvent.setup()
    render(<TemplatesShowcasePage />)
    await user.click(screen.getByRole('radio', { name: /Willow Creek Dental/ }))
    const frame = screen.getByTitle('Template preview') as HTMLIFrameElement
    expect(frame.src).toContain('profile=willow-creek')
  })

  it('toggles between desktop and mobile preview widths', async () => {
    const user = userEvent.setup()
    render(<TemplatesShowcasePage />)
    const frame = screen.getByTitle('Template preview') as HTMLIFrameElement
    expect(frame.style.width).toBe('100%')
    await user.click(screen.getByRole('radio', { name: 'Mobile width' }))
    expect(frame.style.width).toBe('390px')
  })

  it('lets the control bar wrap instead of overflowing when Corporate adds its extra Variant group', () => {
    // jsdom has no real layout engine, so this can't assert "no horizontal overflow"
    // directly — it guards the structural fix instead: every control row (the
    // outer bar, the fieldset group, and each radiogroup's own button row) must be
    // able to wrap onto additional lines, since Corporate's extra Variant fieldset
    // plus its two long sample-profile labels made the unwrapped row wider than the
    // page's content column even at full browser width. Losing `flex-wrap` here
    // would silently reintroduce that overflow. A real-browser check at the
    // viewports in the phase report remains the authoritative confirmation.
    render(<TemplatesShowcasePage />)
    const familyGroup = screen.getByRole('radiogroup', { name: 'Family' })
    const variantGroup = screen.getByRole('radiogroup', { name: 'Variant' })
    const profileGroup = screen.getByRole('radiogroup', { name: 'Sample profile' })
    const controlBar = familyGroup.closest('.rounded-lg')!
    const fieldsetRow = familyGroup.closest('fieldset')!.parentElement!

    for (const el of [controlBar, fieldsetRow, familyGroup, variantGroup, profileGroup]) {
      expect(el.className).toMatch(/flex-wrap/)
    }
  })
})
