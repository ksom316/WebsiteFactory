import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SafeLink } from '../components/SafeLink'

describe('SafeLink', () => {
  it('renders nothing for an unsafe href', () => {
    const { container } = render(<SafeLink href="javascript:alert(1)">Click</SafeLink>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when href is undefined', () => {
    const { container } = render(<SafeLink href={undefined}>Click</SafeLink>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an internal anchor without target=_blank', () => {
    render(<SafeLink href="#about">About</SafeLink>)
    const link = screen.getByRole('link', { name: 'About' })
    expect(link).toHaveAttribute('href', '#about')
    expect(link).not.toHaveAttribute('target')
  })

  it('renders an external https link with target=_blank and rel=noopener noreferrer', () => {
    render(<SafeLink href="https://example.com">Example</SafeLink>)
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders a mailto link as-is', () => {
    render(<SafeLink href="mailto:hi@example.com">Email us</SafeLink>)
    expect(screen.getByRole('link', { name: 'Email us' })).toHaveAttribute('href', 'mailto:hi@example.com')
  })
})
