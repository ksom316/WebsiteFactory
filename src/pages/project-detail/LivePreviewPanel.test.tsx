import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LivePreviewPanel } from './LivePreviewPanel'
import { PREVIEW_CONFIG_MESSAGE, PREVIEW_READY_MESSAGE } from '../../components/preview/previewMessages'
import { parseCorporateConfig } from '../../templates/corporate'

function getIframe(): HTMLIFrameElement {
  return screen.getByTitle('Live project preview') as HTMLIFrameElement
}

function announceReady() {
  const iframe = getIframe()
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: PREVIEW_READY_MESSAGE },
        origin: window.location.origin,
        source: iframe.contentWindow,
      }),
    )
  })
}

describe('LivePreviewPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not post to the iframe before it announces readiness', () => {
    const config = parseCorporateConfig({ business: { name: 'Acme' } })
    render(<LivePreviewPanel config={config} />)
    const iframe = getIframe()
    const postMessageSpy = vi.spyOn(iframe.contentWindow!, 'postMessage')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('posts the current config once the iframe is ready, and again on every change', () => {
    const config = parseCorporateConfig({ business: { name: 'Acme' } })
    const { rerender } = render(<LivePreviewPanel config={config} />)
    const iframe = getIframe()
    const postMessageSpy = vi.spyOn(iframe.contentWindow!, 'postMessage')

    announceReady()
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: PREVIEW_CONFIG_MESSAGE, config },
      window.location.origin,
    )

    const updated = parseCorporateConfig({ business: { name: 'Acme v2' } })
    rerender(<LivePreviewPanel config={updated} />)
    expect(postMessageSpy).toHaveBeenLastCalledWith(
      { type: PREVIEW_CONFIG_MESSAGE, config: updated },
      window.location.origin,
    )
  })

  it('ignores a ready message from a different window', () => {
    const config = parseCorporateConfig({})
    render(<LivePreviewPanel config={config} />)
    const iframe = getIframe()
    const postMessageSpy = vi.spyOn(iframe.contentWindow!, 'postMessage')

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: PREVIEW_READY_MESSAGE },
        origin: window.location.origin,
        source: window, // not the iframe
      }),
    )
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('ignores a ready message from a different origin', () => {
    const config = parseCorporateConfig({})
    render(<LivePreviewPanel config={config} />)
    const iframe = getIframe()
    const postMessageSpy = vi.spyOn(iframe.contentWindow!, 'postMessage')

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: PREVIEW_READY_MESSAGE },
        origin: 'https://evil.example',
        source: iframe.contentWindow,
      }),
    )
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('shows a reload action if the preview never announces readiness', () => {
    render(<LivePreviewPanel config={parseCorporateConfig({})} />)
    expect(screen.queryByText("The preview didn't load in time.")).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(screen.getByText("The preview didn't load in time.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload preview' })).toBeInTheDocument()
  })

  it('switching the viewport toggle does not touch the postMessage channel', async () => {
    vi.useRealTimers()
    const config = parseCorporateConfig({})
    render(<LivePreviewPanel config={config} />)
    const iframe = getIframe()
    announceReady()
    const postMessageSpy = vi.spyOn(iframe.contentWindow!, 'postMessage')

    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: 'Mobile width' }))

    expect(postMessageSpy).not.toHaveBeenCalled()
    expect(iframe.style.width).toBe('390px')
  })
})
