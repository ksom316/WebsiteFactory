import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TemplatePreviewPage } from './TemplatePreviewPage'
import { PREVIEW_CONFIG_MESSAGE, PREVIEW_READY_MESSAGE } from '../components/preview/previewMessages'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/templates/preview" element={<TemplatePreviewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function postDraftConfig(config: unknown, overrides: Partial<MessageEventInit> = {}) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: PREVIEW_CONFIG_MESSAGE, config },
        origin: window.location.origin,
        // In jsdom (no real parent/iframe separation) window.parent === window, so this
        // simulates "the embedding parent sent this" the same way a real browser would.
        source: window.parent,
        ...overrides,
      }),
    )
  })
}

describe('TemplatePreviewPage', () => {
  it('renders the requested sample profile', () => {
    renderAt('/templates/preview?variant=neutral&profile=willow-creek')
    expect(screen.getByText('Willow Creek Dental', { selector: 'a' })).toBeInTheDocument()
  })

  it('applies a variant override on top of the sample profile', () => {
    renderAt('/templates/preview?variant=neutral&profile=fathom')
    // Fathom's own config says "premium"; the ?variant= param should win.
    expect(document.querySelector('.wf-corporate--neutral')).toBeInTheDocument()
    expect(document.querySelector('.wf-corporate--premium')).not.toBeInTheDocument()
  })

  it('falls back to the first sample profile for an unknown profile id', () => {
    renderAt('/templates/preview?profile=does-not-exist')
    expect(screen.getByText('Fathom', { selector: 'a' })).toBeInTheDocument()
  })

  describe('draft mode (?mode=draft)', () => {
    it('shows a waiting state until the first config arrives', () => {
      renderAt('/templates/preview?mode=draft')
      expect(screen.getByText('Waiting for preview data…')).toBeInTheDocument()
    })

    it('renders the premium variant once a draft config is posted', () => {
      renderAt('/templates/preview?mode=draft')
      postDraftConfig({ variant: 'premium', business: { name: 'Fathom Draft' }, hero: { heading: 'Draft heading' } })
      expect(screen.getByText('Draft heading')).toBeInTheDocument()
      expect(document.querySelector('.wf-corporate--premium')).toBeInTheDocument()
    })

    it('re-renders with the neutral variant when a later message changes it', () => {
      renderAt('/templates/preview?mode=draft')
      postDraftConfig({ variant: 'premium', hero: { heading: 'First' } })
      expect(screen.getByText('First')).toBeInTheDocument()

      postDraftConfig({ variant: 'neutral', hero: { heading: 'Second' } })
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(document.querySelector('.wf-corporate--neutral')).toBeInTheDocument()
      expect(document.querySelector('.wf-corporate--premium')).not.toBeInTheDocument()
    })

    it('normalizes an invalid color or link in a draft message instead of crashing', () => {
      renderAt('/templates/preview?mode=draft')
      expect(() =>
        postDraftConfig({
          variant: 'neutral',
          brand: { primaryColor: 'not-a-color' },
          hero: { heading: 'Still renders', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } },
        }),
      ).not.toThrow()
      expect(screen.getByText('Still renders')).toBeInTheDocument()
    })

    it('ignores a message from a different origin', () => {
      renderAt('/templates/preview?mode=draft')
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: PREVIEW_CONFIG_MESSAGE, config: { hero: { heading: 'Should not appear' } } },
            origin: 'https://evil.example',
          }),
        )
      })
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
      expect(screen.getByText('Waiting for preview data…')).toBeInTheDocument()
    })

    it('ignores a same-origin message from an unrelated source window', () => {
      renderAt('/templates/preview?mode=draft')
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: PREVIEW_CONFIG_MESSAGE, config: { hero: { heading: 'Should not appear' } } },
            origin: window.location.origin,
            source: null, // not window.parent — e.g. some other same-origin tab/frame
          }),
        )
      })
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
      expect(screen.getByText('Waiting for preview data…')).toBeInTheDocument()
    })

    it('ignores an unrelated message type', () => {
      renderAt('/templates/preview?mode=draft')
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: PREVIEW_READY_MESSAGE },
            origin: window.location.origin,
          }),
        )
      })
      expect(screen.getByText('Waiting for preview data…')).toBeInTheDocument()
    })
  })
})
