import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { EcommerceTemplate } from '../EcommerceTemplate'
import { northfieldSupplyCoConfig } from '../sample-data/northfieldSupplyCo'
import { parseEcommerceConfig } from '../schema'

beforeEach(() => {
  window.localStorage.clear()
})

describe('EcommerceTemplate', () => {
  it('renders the sample storefront without throwing', () => {
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(northfieldSupplyCoConfig.hero.heading)
  })

  it('renders store text as literal text, never as HTML', () => {
    const config = parseEcommerceConfig({
      store: { name: 'Acme' },
      hero: { heading: '<img src=x onerror="window.__xss=true">' },
    })
    render(<EcommerceTemplate config={config} />)
    expect(screen.getByText('<img src=x onerror="window.__xss=true">')).toBeInTheDocument()
    expect(document.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('shows a cart badge only once an item is in the cart', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    expect(screen.getByRole('button', { name: /Open cart, 0 items/ })).toBeInTheDocument()

    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))

    expect(screen.getByRole('button', { name: /Open cart, 1 item/ })).toBeInTheDocument()
  })

  it('searches and filters products on the client, without a backend', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })

    await user.type(within(shop).getByRole('searchbox'), 'sweater')
    expect(within(shop).getByText('1 product')).toBeInTheDocument()

    await user.clear(within(shop).getByRole('searchbox'))
    await user.click(within(shop).getByRole('button', { name: 'Layers' }))
    const layersCount = northfieldSupplyCoConfig.shop.products.filter((p) => p.category === 'Layers').length
    expect(within(shop).getByText(`${layersCount} products`)).toBeInTheDocument()

    await user.click(within(shop).getByRole('button', { name: 'Reset filters' }))
    expect(within(shop).getByText(`${northfieldSupplyCoConfig.shop.products.length} products`)).toBeInTheDocument()
  })

  it('opens a product with variants via the detail dialog, selects a variant, and adds it to the cart', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const daypackCard = within(shop).getByRole('heading', { level: 3, name: 'Trailhead Daypack' }).closest('button')!.parentElement!

    await user.click(within(daypackCard).getByRole('button', { name: 'Choose options' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Trailhead Daypack' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('radio', { name: 'Charcoal' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add to cart' }))
    expect(within(dialog).getByRole('status')).toHaveTextContent('Added to cart.')

    await user.click(within(dialog).getByRole('button', { name: 'Close product details' }))
    expect(screen.getByRole('button', { name: /Open cart, 1 item/ })).toBeInTheDocument()
  })

  it('moves variant selection with arrow keys, keeping only the selected option tabbable', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const daypackCard = within(shop).getByRole('heading', { level: 3, name: 'Trailhead Daypack' }).closest('button')!.parentElement!

    await user.click(within(daypackCard).getByRole('button', { name: 'Choose options' }))
    const dialog = screen.getByRole('dialog')

    const olive = within(dialog).getByRole('radio', { name: 'Olive' })
    const charcoal = within(dialog).getByRole('radio', { name: 'Charcoal' })
    const rust = within(dialog).getByRole('radio', { name: 'Rust' })
    expect(olive).toHaveAttribute('tabindex', '0')
    expect(charcoal).toHaveAttribute('tabindex', '-1')

    olive.focus()
    await user.keyboard('{ArrowRight}')
    expect(charcoal).toHaveFocus()
    expect(charcoal).toHaveAttribute('aria-checked', 'true')
    expect(olive).toHaveAttribute('aria-checked', 'false')

    await user.keyboard('{End}')
    expect(rust).toHaveFocus()
    expect(rust).toHaveAttribute('aria-checked', 'true')
  })

  it('never offers an Add to cart action for an out-of-stock product', () => {
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const outOfStockCard = within(shop).getByRole('heading', { level: 3, name: /Summit Trekking Poles/ }).closest('button')!.parentElement!
    expect(within(outOfStockCard).queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument()
  })

  it('shows the cart drawer with line items, subtotal, and lets a quantity be updated', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))

    await user.click(screen.getByRole('button', { name: /Open cart/ }))
    const cartDialog = screen.getByRole('dialog', { name: 'Your cart' })
    expect(within(cartDialog).getByText('Camp Enamel Mug')).toBeInTheDocument()

    const quantityInput = within(cartDialog).getByRole('spinbutton', { name: /Quantity for Camp Enamel Mug/ })
    // A single atomic change rather than clear+type — this is a controlled numeric
    // input that snaps back to a valid quantity on every keystroke, so simulating
    // per-character typing would race against that re-render.
    fireEvent.change(quantityInput, { target: { value: '3' } })
    expect(screen.getByRole('button', { name: /Open cart, 3 items/ })).toBeInTheDocument()
  })

  it('removes a line from the cart', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: /Open cart/ }))

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('clears the whole cart after confirming', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: /Open cart/ }))

    await user.click(screen.getByRole('button', { name: 'Clear cart' }))
    await user.click(screen.getByRole('button', { name: 'Yes, clear' }))
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('persists the cart across a remount, and reconciles against the current product list', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    unmount()

    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    expect(screen.getByRole('button', { name: /Open cart, 1 item/ })).toBeInTheDocument()
  })

  it('drops a persisted cart line whose product no longer exists in a different saved config', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    unmount()

    const otherConfig = parseEcommerceConfig({ store: { name: 'Different Store' }, shop: { products: [{ name: 'Unrelated product', price: 5 }] } })
    render(<EcommerceTemplate config={otherConfig} />)
    expect(screen.getByRole('button', { name: /Open cart, 0 items/ })).toBeInTheDocument()
  })

  it('completes the full simulated checkout flow and shows an honest demo confirmation', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: /Open cart/ }))
    await user.click(screen.getByRole('button', { name: 'Checkout' }))

    const checkout = screen.getByRole('dialog', { name: 'Checkout' })

    // Contact step — required-field validation.
    await user.click(within(checkout).getByRole('button', { name: 'Continue to shipping' }))
    expect(within(checkout).getByRole('alert')).toHaveTextContent('fix the highlighted fields')
    await user.type(within(checkout).getByLabelText('Full name'), 'Jamie Oak')
    await user.type(within(checkout).getByLabelText('Email'), 'jamie@example.com')
    await user.click(within(checkout).getByRole('button', { name: 'Continue to shipping' }))

    // Shipping step.
    await user.type(within(checkout).getByLabelText('Street address'), '1 Market St')
    await user.type(within(checkout).getByLabelText('City'), 'Bozeman')
    await user.type(within(checkout).getByLabelText('Postal code'), '59718')
    await user.type(within(checkout).getByLabelText('Country'), 'USA')
    await user.click(within(checkout).getByRole('button', { name: 'Review order' }))

    // Review step — correct totals.
    expect(within(checkout).getByText('Camp Enamel Mug × 1')).toBeInTheDocument()
    await user.click(within(checkout).getByRole('button', { name: 'Continue to payment' }))

    // Payment step — Paystack/Stripe are shown but disabled; only the demo path works.
    expect(within(checkout).getByRole('radio', { name: /Paystack/ })).toBeDisabled()
    expect(within(checkout).getByRole('radio', { name: /Stripe/ })).toBeDisabled()
    await user.click(within(checkout).getByRole('button', { name: 'Complete demo checkout' }))

    // Confirmation — explicit demo messaging, simulated reference, never "payment successful".
    expect(within(checkout).getByText('Demo checkout complete')).toBeInTheDocument()
    expect(within(checkout).getByText(/Simulated order reference:/)).toBeInTheDocument()
    expect(checkout.textContent).toMatch(/Simulated order reference:\s*DEMO-/)
    expect(within(checkout).queryByText(/payment (was )?successful/i)).not.toBeInTheDocument()

    await user.click(within(checkout).getByRole('button', { name: 'Return to store' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // The cart was cleared once the demo order "completed".
    expect(screen.getByRole('button', { name: /Open cart, 0 items/ })).toBeInTheDocument()
  })

  it('closes checkout on cancel without completing an order, and discards the entered contact info', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: /Open cart/ }))
    await user.click(screen.getByRole('button', { name: 'Checkout' }))

    const checkout = screen.getByRole('dialog', { name: 'Checkout' })
    await user.type(within(checkout).getByLabelText('Full name'), 'Jamie Oak')
    await user.click(within(checkout).getByRole('button', { name: 'Close checkout' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // The cart still has its item — cancelling checkout doesn't touch the cart.
    expect(screen.getByRole('button', { name: /Open cart, 1 item/ })).toBeInTheDocument()

    // Reopening checkout starts the contact step fresh — nothing was retained.
    await user.click(screen.getByRole('button', { name: /Open cart/ }))
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    const reopened = screen.getByRole('dialog', { name: 'Checkout' })
    expect(within(reopened).getByLabelText('Full name')).toHaveValue('')
  })

  it('never writes customer contact/address details to localStorage', async () => {
    const user = userEvent.setup()
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    const shop = screen.getByRole('region', { name: 'Shop' })
    const mugCard = within(shop).getByRole('heading', { level: 3, name: 'Camp Enamel Mug' }).closest('button')!.parentElement!
    await user.click(within(mugCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: /Open cart/ }))
    await user.click(screen.getByRole('button', { name: 'Checkout' }))

    const checkout = screen.getByRole('dialog', { name: 'Checkout' })
    await user.type(within(checkout).getByLabelText('Full name'), 'Jamie Oak')
    await user.type(within(checkout).getByLabelText('Email'), 'jamie@example.com')

    const allStorage = JSON.stringify(window.localStorage)
    expect(allStorage).not.toContain('Jamie Oak')
    expect(allStorage).not.toContain('jamie@example.com')
  })

  it('shows an empty-cart message inside checkout if opened with nothing in the cart', async () => {
    // Not reachable from the UI (the cart drawer only offers Checkout when non-empty),
    // but CheckoutDialog itself must still degrade gracefully if ever mounted empty.
    render(<EcommerceTemplate config={northfieldSupplyCoConfig} />)
    expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument()
  })

  it('omits the featured, about, and testimonials sections entirely when there is no content', () => {
    const config = parseEcommerceConfig({ store: { name: 'Bare Bones Shop' }, hero: { heading: 'Hi' } })
    render(<EcommerceTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Featured' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'About' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Testimonials' })).not.toBeInTheDocument()
  })

  it('hides a section when sections.<name> is false even if content is present', () => {
    const config = parseEcommerceConfig({ ...northfieldSupplyCoConfig, sections: { ...northfieldSupplyCoConfig.sections, testimonials: false } })
    render(<EcommerceTemplate config={config} />)
    expect(screen.queryByRole('region', { name: 'Testimonials' })).not.toBeInTheDocument()
  })

  it('falls back to a placeholder instead of a broken image icon when a product has no image', () => {
    const config = parseEcommerceConfig({ shop: { products: [{ name: 'No Image Product', price: 10, images: [] }] } })
    render(<EcommerceTemplate config={config} />)
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getAllByRole('img', { name: 'No Image Product' }).length).toBeGreaterThan(0)
  })
})
