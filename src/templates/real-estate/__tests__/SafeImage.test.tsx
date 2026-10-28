import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SafeImage } from '../components/SafeImage'

describe('SafeImage', () => {
  it('shows the fallback label when no src is provided', () => {
    render(<SafeImage src={undefined} alt="A property" fallbackLabel="AB" />)
    expect(screen.getByRole('img', { name: 'A property' })).toBeInTheDocument()
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('renders an <img> when src is provided', () => {
    render(<SafeImage src="https://example.com/a.png" alt="A property" fallbackLabel="AB" />)
    const img = screen.getByRole('img', { name: 'A property' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://example.com/a.png')
  })

  it('falls back to the placeholder after the image fails to load', () => {
    render(<SafeImage src="https://example.com/broken.png" alt="A property" fallbackLabel="AB" />)
    const img = screen.getByRole('img', { name: 'A property' })
    fireEvent.error(img)
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'A property' })?.tagName).not.toBe('IMG')
  })

  it('defaults to lazy loading', () => {
    render(<SafeImage src="https://example.com/a.png" alt="A property" fallbackLabel="AB" />)
    expect(screen.getByRole('img', { name: 'A property' })).toHaveAttribute('loading', 'lazy')
  })
})
