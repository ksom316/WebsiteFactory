import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RestaurantTemplate } from '../RestaurantTemplate'
import { gildedFigConfig } from '../sample-data/gildedFig'
import { parseRestaurantConfig } from '../schema'

describe('RestaurantTemplate', () => {
  it('renders the sample restaurant without throwing', () => {
    render(<RestaurantTemplate config={gildedFigConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(gildedFigConfig.hero.heading)
  })

  it('renders restaurant text as literal text, never as HTML', () => {
    const config = parseRestaurantConfig({
      restaurant: { name: 'Acme' },
      hero: { heading: '<img src=x onerror="window.__xss=true">' },
    })
    render(<RestaurantTemplate config={config} />)
    expect(screen.getByText('<img src=x onerror="window.__xss=true">')).toBeInTheDocument()
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('opens and closes the mobile nav menu', async () => {
    const user = userEvent.setup()
    render(<RestaurantTemplate config={gildedFigConfig} />)

    const openButton = screen.getByRole('button', { name: 'Open menu' })
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()

    await user.click(openButton)
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
    // The mobile nav's own copy of the links is now visible, in addition to the desktop one.
    expect(screen.getAllByRole('link', { name: 'Menu' }).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })

  it('closes the mobile nav when a link inside it is clicked', async () => {
    const user = userEvent.setup()
    render(<RestaurantTemplate config={gildedFigConfig} />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    const mobileNavLinks = screen.getAllByRole('link', { name: 'Gallery' })
    await user.click(mobileNavLinks[mobileNavLinks.length - 1])

    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })

  it('renders safe mailto and tel links from contact info', () => {
    render(<RestaurantTemplate config={gildedFigConfig} />)
    const mailLinks = screen.getAllByRole('link', { name: gildedFigConfig.contact.email })
    expect(mailLinks[0]).toHaveAttribute('href', `mailto:${gildedFigConfig.contact.email}`)
  })

  it('omits the reservation call to action when no reservation URL is configured', () => {
    const config = parseRestaurantConfig({ restaurant: { name: 'Acme' } })
    render(<RestaurantTemplate config={config} />)
    expect(screen.queryByRole('link', { name: 'Book a reservation' })).not.toBeInTheDocument()
  })

  it('omits every link to the reservation URL when reservations are disabled, without a broken link', () => {
    const config = parseRestaurantConfig({
      ...gildedFigConfig,
      sections: { ...gildedFigConfig.sections, reservation: false },
    })
    render(<RestaurantTemplate config={config} />)
    const reservationLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === gildedFigConfig.contact.reservationUrl)
    expect(reservationLinks).toHaveLength(0)
  })

  it('omits menu/gallery/hours sections entirely when there is no content, instead of rendering empty shells', () => {
    const config = parseRestaurantConfig({ restaurant: { name: 'Bare Bones Bistro' }, hero: { heading: 'Hi' } })
    render(<RestaurantTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Gallery' })).not.toBeInTheDocument()
  })

  it('hides a section when sections.<name> is false even if content is present', () => {
    const config = parseRestaurantConfig({ ...gildedFigConfig, sections: { ...gildedFigConfig.sections, menu: false } })
    render(<RestaurantTemplate config={config} />)
    expect(screen.queryByRole('heading', { name: gildedFigConfig.menu.heading })).not.toBeInTheDocument()
  })

  it('never renders a visible nav bar when there are no nav links or reservation link', () => {
    const config = parseRestaurantConfig({ restaurant: { name: 'Acme' } })
    render(<RestaurantTemplate config={config} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
  })
})
