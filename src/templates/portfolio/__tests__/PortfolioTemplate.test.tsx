import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PortfolioTemplate } from '../PortfolioTemplate'
import { lenaAshfordConfig } from '../sample-data/lenaAshford'
import { parsePortfolioConfig } from '../schema'

describe('PortfolioTemplate', () => {
  it('renders the sample portfolio without throwing', () => {
    render(<PortfolioTemplate config={lenaAshfordConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(lenaAshfordConfig.hero.heading)
  })

  it('renders person text as literal text, never as HTML', () => {
    const config = parsePortfolioConfig({
      person: { name: 'Acme' },
      hero: { heading: '<img src=x onerror="window.__xss=true">' },
    })
    render(<PortfolioTemplate config={config} />)
    expect(screen.getByText('<img src=x onerror="window.__xss=true">')).toBeInTheDocument()
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('opens and closes the mobile nav menu', async () => {
    const user = userEvent.setup()
    render(<PortfolioTemplate config={lenaAshfordConfig} />)

    const openButton = screen.getByRole('button', { name: 'Open menu' })
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()

    await user.click(openButton)
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })

  it('renders the availability status from config rather than a hardcoded value', () => {
    render(<PortfolioTemplate config={lenaAshfordConfig} />)
    expect(screen.getByText(lenaAshfordConfig.person.availability!)).toBeInTheDocument()
  })

  it('omits the availability badge entirely when none is configured', () => {
    const config = parsePortfolioConfig({ person: { name: 'Acme' } })
    render(<PortfolioTemplate config={config} />)
    expect(screen.queryByText(/Available|Booked|Booking/)).not.toBeInTheDocument()
  })

  it('filters selected work by category on the client, without a backend', async () => {
    const user = userEvent.setup()
    render(<PortfolioTemplate config={lenaAshfordConfig} />)
    const workSection = screen.getByRole('region', { name: 'Selected work' })

    const total = lenaAshfordConfig.work.projects.length
    const designSystemsCount = lenaAshfordConfig.work.projects.filter((p) => p.category === 'Design systems').length
    expect(within(workSection).getAllByRole('heading', { level: 3 })).toHaveLength(total)

    await user.click(within(workSection).getByRole('button', { name: 'Design systems' }))
    expect(within(workSection).getAllByRole('heading', { level: 3 })).toHaveLength(designSystemsCount)

    await user.click(within(workSection).getByRole('button', { name: 'All' }))
    expect(within(workSection).getAllByRole('heading', { level: 3 })).toHaveLength(total)
  })

  it('only makes a project card a link when it has a validated href', () => {
    const config = parsePortfolioConfig({
      work: {
        projects: [
          { title: 'Linked project', href: 'https://example.com/case-study' },
          { title: 'Unlinked project' },
        ],
      },
    })
    render(<PortfolioTemplate config={config} />)
    expect(screen.getByRole('link', { name: /Linked project/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Unlinked project/ })).not.toBeInTheDocument()
    // The unlinked project's content still renders — just not as a link.
    expect(screen.getByText('Unlinked project')).toBeInTheDocument()
  })

  it('shows an intentional empty state for selected work when there are no projects, not a broken section', () => {
    const config = parsePortfolioConfig({ person: { name: 'Acme' } })
    render(<PortfolioTemplate config={config} />)
    expect(screen.getByRole('region', { name: 'Selected work' })).toBeInTheDocument()
    expect(screen.getByText(/Work is on its way/)).toBeInTheDocument()
  })

  it('omits the about, skills, experience, and testimonials sections entirely when there is no content', () => {
    const config = parsePortfolioConfig({ person: { name: 'Bare Bones' }, hero: { heading: 'Hi' } })
    render(<PortfolioTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'About' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Skills and services' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Experience' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Testimonials' })).not.toBeInTheDocument()
  })

  it('hides a section when sections.<name> is false even if content is present', () => {
    const config = parsePortfolioConfig({ ...lenaAshfordConfig, sections: { ...lenaAshfordConfig.sections, testimonials: false } })
    render(<PortfolioTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Testimonials' })).not.toBeInTheDocument()
  })

  it('renders a safe mailto link for contact, and a booking link when configured', () => {
    render(<PortfolioTemplate config={lenaAshfordConfig} />)
    const mailLink = screen.getByRole('link', { name: /Email Lena/ })
    expect(mailLink).toHaveAttribute('href', `mailto:${lenaAshfordConfig.contact.email}`)
    expect(screen.getByRole('link', { name: 'Book a call' })).toHaveAttribute('href', lenaAshfordConfig.contact.bookingUrl)
  })

  it('omits the contact section entirely when there is no email, booking link, or social link', () => {
    const config = parsePortfolioConfig({ person: { name: 'Acme' } })
    render(<PortfolioTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Contact' })).not.toBeInTheDocument()
  })

  it('never includes fabricated proficiency percentages or progress bars for skills', () => {
    render(<PortfolioTemplate config={lenaAshfordConfig} />)
    expect(document.querySelector('progress, [role="progressbar"]')).toBeNull()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('never renders a visible nav bar when there are no nav links', () => {
    const config = parsePortfolioConfig({ person: { name: 'Acme' } })
    render(<PortfolioTemplate config={config} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
  })
})
