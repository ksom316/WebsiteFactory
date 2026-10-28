import { describe, expect, it } from 'vitest'
import { isExternalHref, isRenderableHref } from '../components/links'

describe('isRenderableHref', () => {
  it.each(['#about', '/pricing', 'mailto:hi@example.com', 'tel:+15555550123', 'https://example.com'])(
    'allows %s',
    (href) => {
      expect(isRenderableHref(href)).toBe(true)
    },
  )

  it.each([undefined, '', '#', 'javascript:alert(1)', 'http://example.com', 'data:text/html,<script>', 'ftp://example.com'])(
    'rejects %s',
    (href) => {
      expect(isRenderableHref(href)).toBe(false)
    },
  )
})

describe('isExternalHref', () => {
  it('treats https hrefs as external', () => {
    expect(isExternalHref('https://example.com')).toBe(true)
  })

  it('treats internal anchors, mailto, and tel as not external', () => {
    expect(isExternalHref('#about')).toBe(false)
    expect(isExternalHref('mailto:hi@example.com')).toBe(false)
    expect(isExternalHref('tel:+15555550123')).toBe(false)
  })
})
