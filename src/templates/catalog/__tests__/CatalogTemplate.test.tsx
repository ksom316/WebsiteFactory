import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CatalogTemplate } from '../CatalogTemplate'
import { marlowAndFinchConfig } from '../sample-data/marlowAndFinch'
import { parseCatalogConfig } from '../schema'

describe('CatalogTemplate', () => {
  it('renders the sample shop without throwing', () => {
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(marlowAndFinchConfig.hero.heading)
  })

  it('renders business text as literal text, never as HTML', () => {
    const config = parseCatalogConfig({
      business: { name: 'Acme' },
      hero: { heading: '<img src=x onerror="window.__xss=true">' },
    })
    render(<CatalogTemplate config={config} />)
    expect(screen.getByText('<img src=x onerror="window.__xss=true">')).toBeInTheDocument()
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('opens and closes the mobile nav menu', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)

    const openButton = screen.getByRole('button', { name: 'Open menu' })
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()

    await user.click(openButton)
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })

  it('shows the configured promo message rather than a hardcoded one', () => {
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    expect(screen.getByText(marlowAndFinchConfig.hero.promoMessage!)).toBeInTheDocument()
  })

  it('renders every product as a card with a product count', () => {
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const total = marlowAndFinchConfig.shop.products.length
    expect(within(shop).getByText(`${total} products`)).toBeInTheDocument()
    for (const product of marlowAndFinchConfig.shop.products) {
      expect(within(shop).getByRole('heading', { level: 3, name: product.name })).toBeInTheDocument()
    }
  })

  it('searches products by name on the client, without a backend', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const searchBox = within(shop).getByRole('searchbox')

    await user.type(searchBox, 'stoneware')
    expect(within(shop).getByText('1 product')).toBeInTheDocument()
    expect(within(shop).getByRole('button', { name: /Hand-thrown stoneware bowl/ })).toBeInTheDocument()
    expect(within(shop).queryByRole('button', { name: /Linen table runner/ })).not.toBeInTheDocument()
  })

  it('filters products by category on the client', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const ceramicsCount = marlowAndFinchConfig.shop.products.filter((p) => p.category === 'Ceramics').length

    await user.click(within(shop).getByRole('button', { name: 'Ceramics' }))
    expect(within(shop).getByText(`${ceramicsCount} product`)).toBeInTheDocument()
  })

  it('resets search and category filters with the reset control', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const total = marlowAndFinchConfig.shop.products.length

    await user.type(within(shop).getByRole('searchbox'), 'bowl')
    expect(within(shop).getByRole('button', { name: 'Reset filters' })).toBeInTheDocument()

    await user.click(within(shop).getByRole('button', { name: 'Reset filters' }))
    expect(within(shop).getByText(`${total} products`)).toBeInTheDocument()
    expect(within(shop).queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument()
  })

  it('shows a no-results message instead of an empty grid when nothing matches', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })

    await user.type(within(shop).getByRole('searchbox'), 'this matches absolutely nothing at all')
    expect(within(shop).getByText(/No products match/)).toBeInTheDocument()
  })

  it('opens a product detail dialog on click, closes it with Escape, and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const product = marlowAndFinchConfig.shop.products[0]
    const trigger = within(shop).getByRole('button', { name: new RegExp(product.name) })

    await user.click(trigger)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { level: 2, name: product.name })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Close product details' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes the product detail dialog with the close button', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    await user.click(within(shop).getByRole('button', { name: /Hand-thrown stoneware bowl/ }))

    await user.click(screen.getByRole('button', { name: 'Close product details' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows "Contact for price" (or the configured equivalent) for a product with no price', () => {
    const config = parseCatalogConfig({
      shop: { products: [{ name: 'Custom piece' }], noPriceLabel: 'Ask about pricing' },
    })
    render(<CatalogTemplate config={config} />)
    expect(screen.getByText('Ask about pricing')).toBeInTheDocument()
  })

  it('shows a struck-through regular price next to a valid sale price', async () => {
    const user = userEvent.setup()
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const onSale = marlowAndFinchConfig.shop.products.find((p) => p.salePrice !== undefined)!

    await user.click(within(shop).getByRole('button', { name: new RegExp(onSale.name) }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('$64')).toBeInTheDocument()
    expect(within(dialog).getByText('$52')).toBeInTheDocument()
  })

  it('falls back to a placeholder instead of a broken image icon when a product has no image', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'No Image Product', images: [] }] } })
    render(<CatalogTemplate config={config} />)
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getAllByRole('img', { name: 'No Image Product' }).length).toBeGreaterThan(0)
  })

  it('renders a featured section limited to the configured products, and never duplicates the whole catalog', () => {
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    const featured = screen.getByRole('region', { name: 'Featured' })
    expect(within(featured).getAllByRole('button').length).toBe(marlowAndFinchConfig.featured.productSlugs.length)
    expect(marlowAndFinchConfig.featured.productSlugs.length).toBeLessThan(marlowAndFinchConfig.shop.products.length)
  })

  it('omits the featured section entirely when there are no (valid) featured products', () => {
    const config = parseCatalogConfig({
      shop: { products: [{ name: 'A product' }] },
      featured: { productSlugs: ['not-a-real-product'] },
    })
    render(<CatalogTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Featured' })).not.toBeInTheDocument()
  })

  it('renders safe tel/WhatsApp/email contact links built from configured channels', () => {
    render(<CatalogTemplate config={marlowAndFinchConfig} />)
    expect(screen.getByRole('link', { name: 'Email us' })).toHaveAttribute('href', `mailto:${marlowAndFinchConfig.contact.email}`)
    expect(screen.getByRole('link', { name: 'WhatsApp us' })).toHaveAttribute('href', expect.stringContaining('https://wa.me/'))
  })

  it('omits the contact section entirely when no contact channel is configured', () => {
    const config = parseCatalogConfig({ business: { name: 'Acme' } })
    render(<CatalogTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Contact' })).not.toBeInTheDocument()
  })

  it('hides a section when sections.<name> is false even if content is present', () => {
    const config = parseCatalogConfig({ ...marlowAndFinchConfig, sections: { ...marlowAndFinchConfig.sections, about: false } })
    render(<CatalogTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'About' })).not.toBeInTheDocument()
  })

  it('shows an intentional empty state for the shop when there are no products, not a broken section', () => {
    const config = parseCatalogConfig({ business: { name: 'Acme' } })
    render(<CatalogTemplate config={config} />)
    expect(screen.getByRole('region', { name: 'Shop' })).toBeInTheDocument()
    expect(screen.getByText(/New products are on their way/)).toBeInTheDocument()
  })
})
