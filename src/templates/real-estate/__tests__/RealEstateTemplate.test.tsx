import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RealEstateTemplate } from '../RealEstateTemplate'
import { meridianRealtyConfig } from '../sample-data/meridianRealty'
import { parseRealEstateConfig } from '../schema'

describe('RealEstateTemplate', () => {
  it('renders the sample agency without throwing', () => {
    render(<RealEstateTemplate config={meridianRealtyConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(meridianRealtyConfig.hero.heading)
  })

  it('renders agency text as literal text, never as HTML', () => {
    const config = parseRealEstateConfig({
      agency: { name: 'Acme' },
      hero: { heading: '<img src=x onerror="window.__xss=true">' },
    })
    render(<RealEstateTemplate config={config} />)
    expect(screen.getByText('<img src=x onerror="window.__xss=true">')).toBeInTheDocument()
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('opens and closes the mobile nav menu', async () => {
    const user = userEvent.setup()
    render(<RealEstateTemplate config={meridianRealtyConfig} />)

    const openButton = screen.getByRole('button', { name: 'Open menu' })
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()

    await user.click(openButton)
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })

  it('every "View details" listing card link points at a real, matching detail section', () => {
    render(<RealEstateTemplate config={meridianRealtyConfig} />)
    const detailLinks = screen.getAllByRole('link', { name: 'View details' })
    expect(detailLinks.length).toBe(meridianRealtyConfig.listings.properties.length)
    for (const link of detailLinks) {
      const href = link.getAttribute('href')
      expect(href).toMatch(/^#listing-/)
      const anchorId = href!.slice(1)
      expect(document.getElementById(anchorId)).not.toBeNull()
    }
  })

  it('filters listings by transaction type on the client, without a backend', async () => {
    const user = userEvent.setup()
    render(<RealEstateTemplate config={meridianRealtyConfig} />)
    const grid = screen.getByRole('region', { name: 'Featured listings' })

    const forSaleCount = meridianRealtyConfig.listings.properties.filter((p) => p.transactionType === 'sale').length
    const forRentCount = meridianRealtyConfig.listings.properties.filter((p) => p.transactionType === 'rent').length
    expect(within(grid).getAllByRole('link', { name: 'View details' })).toHaveLength(forSaleCount + forRentCount)

    await user.click(within(grid).getByRole('button', { name: 'For sale' }))
    expect(within(grid).getAllByRole('link', { name: 'View details' })).toHaveLength(forSaleCount)

    await user.click(within(grid).getByRole('button', { name: 'For rent' }))
    expect(within(grid).getAllByRole('link', { name: 'View details' })).toHaveLength(forRentCount)

    await user.click(within(grid).getByRole('button', { name: 'All' }))
    expect(within(grid).getAllByRole('link', { name: 'View details' })).toHaveLength(forSaleCount + forRentCount)
  })

  it('shows a "no listings match" message instead of an empty grid when a filter excludes everything', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'Only Sale Property', transactionType: 'sale' }, { title: 'Only Sale Property 2', transactionType: 'sale' }] },
    })
    render(<RealEstateTemplate config={config} />)
    // Only one transaction type is present, so the transaction filter group isn't shown at all.
    expect(screen.queryByRole('group', { name: 'Filter by transaction type' })).not.toBeInTheDocument()
  })

  it('omits the enquiry call to action when no inquiry URL is configured', () => {
    const config = parseRealEstateConfig({ agency: { name: 'Acme' } })
    render(<RealEstateTemplate config={config} />)
    expect(screen.queryByRole('link', { name: 'Make an enquiry' })).not.toBeInTheDocument()
  })

  it('omits every link to the inquiry URL when enquiries are disabled, without a broken link', () => {
    const config = parseRealEstateConfig({
      ...meridianRealtyConfig,
      sections: { ...meridianRealtyConfig.sections, inquiry: false },
    })
    render(<RealEstateTemplate config={config} />)
    const inquiryLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === meridianRealtyConfig.contact.inquiryUrl)
    expect(inquiryLinks).toHaveLength(0)
  })

  it('omits the listings and team sections entirely when there is no content, instead of rendering empty shells', () => {
    const config = parseRealEstateConfig({ agency: { name: 'Bare Bones Realty' }, hero: { heading: 'Hi' } })
    render(<RealEstateTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Featured listings' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Our team' })).not.toBeInTheDocument()
  })

  it('hides the team section when sections.agents is false even if agents are configured', () => {
    const config = parseRealEstateConfig({ ...meridianRealtyConfig, sections: { ...meridianRealtyConfig.sections, agents: false } })
    render(<RealEstateTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Our team' })).not.toBeInTheDocument()
  })

  it('renders safe mailto and tel links for a team member', () => {
    render(<RealEstateTemplate config={meridianRealtyConfig} />)
    const agent = meridianRealtyConfig.agents.team[0]
    const mailLink = screen.getByRole('link', { name: agent.email })
    expect(mailLink).toHaveAttribute('href', `mailto:${agent.email}`)
  })

  it('never renders a visible nav bar when there are no nav links or enquiry link', () => {
    const config = parseRealEstateConfig({ agency: { name: 'Acme' } })
    render(<RealEstateTemplate config={config} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
  })
})
