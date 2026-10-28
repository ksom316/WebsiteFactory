import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CorporateTemplate } from '../CorporateTemplate'
import { fathomConfig } from '../sample-data/fathom'
import { willowCreekConfig } from '../sample-data/willowCreek'
import { parseCorporateConfig } from '../schema'

describe('CorporateTemplate', () => {
  it('renders the premium variant without throwing', () => {
    render(<CorporateTemplate config={fathomConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fathomConfig.hero.heading)
  })

  it('renders the neutral variant without throwing', () => {
    render(<CorporateTemplate config={willowCreekConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(willowCreekConfig.hero.heading)
  })

  it('renders the premium variant through the neutral config and vice versa (shared contract)', () => {
    render(<CorporateTemplate config={{ ...willowCreekConfig, variant: 'premium' }} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(willowCreekConfig.hero.heading)

    render(<CorporateTemplate config={{ ...fathomConfig, variant: 'neutral' }} />)
    expect(screen.getAllByRole('heading', { level: 1 })[1]).toHaveTextContent(fathomConfig.hero.heading)
  })

  it('renders business text as literal text, never as HTML', () => {
    const config = parseCorporateConfig({
      business: { name: 'Acme' },
      hero: { heading: '<img src=x onerror="window.__xss=true">' },
    })
    render(<CorporateTemplate config={config} />)
    expect(screen.getByText('<img src=x onerror="window.__xss=true">')).toBeInTheDocument()
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('omits optional sections safely when the config has none of that content', () => {
    const config = parseCorporateConfig({ business: { name: 'Bare Bones Co' }, hero: { heading: 'Hi' } })
    render(<CorporateTemplate config={config} />)
    expect(screen.queryByText('What we offer')).not.toBeInTheDocument()
    expect(screen.queryByText('What people say')).not.toBeInTheDocument()
  })

  it('hides a section when sections.<name> is false even if content is present', () => {
    const config = parseCorporateConfig({
      ...fathomConfig,
      sections: { ...fathomConfig.sections, services: false },
    })
    render(<CorporateTemplate config={config} />)
    expect(screen.queryByRole('heading', { name: 'What we build' })).not.toBeInTheDocument()
  })

  it('renders safe mailto and tel links from contact info', () => {
    render(<CorporateTemplate config={fathomConfig} />)
    const mailLink = screen.getByRole('link', { name: 'Email the team' })
    expect(mailLink).toHaveAttribute('href', 'mailto:hello@fathom.example')
  })
})
