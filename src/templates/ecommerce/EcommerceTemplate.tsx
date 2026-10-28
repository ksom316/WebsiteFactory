import './tokens.css'
import { useState, type CSSProperties } from 'react'
import type { EcommerceConfig } from './schema'
import { CartProvider } from './components/CartContext'
import { EcommerceNav } from './sections/Nav'
import { EcommerceHero } from './sections/Hero'
import { EcommerceShop } from './sections/Shop'
import { EcommerceFeatured } from './sections/Featured'
import { EcommerceAbout } from './sections/About'
import { EcommerceTestimonials } from './sections/Testimonials'
import { EcommerceFooter } from './sections/Footer'
import { CartDrawer } from './sections/CartDrawer'
import { CheckoutDialog } from './checkout/CheckoutDialog'

export interface EcommerceTemplateProps {
  config: EcommerceConfig
}

/**
 * Entry point for the e-commerce template family — mirrors the other five families'
 * standalone rendering boundary: everything under src/templates/ecommerce/ takes its
 * data entirely through `config` and imports nothing from api/, src/auth/, or any
 * Neon/session-aware module. Unlike the other families, this one also owns a small
 * amount of client-only interactive state (cart drawer / checkout dialog open/closed)
 * and wraps everything in `CartProvider`, which is where the demo cart's
 * localStorage read/write actually happens — see components/CartContext.tsx.
 *
 * DEMO ONLY: the cart and checkout below simulate a shopping journey for
 * demonstration purposes. No real payment is processed, no real order is placed, and
 * no customer data leaves the browser — see README.md's "E-commerce storefront
 * template family" section for the full rationale and the documented seam for a
 * future real Paystack/Stripe integration.
 */
export function EcommerceTemplate({ config }: EcommerceTemplateProps) {
  const { sections } = config
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <CartProvider config={config}>
      <div className="wf-ecommerce min-h-screen" style={{ '--site-accent': config.brand.primaryColor } as CSSProperties}>
        <EcommerceNav config={config} onOpenCart={() => setCartOpen(true)} />
        <main>
          <EcommerceHero config={config} />
          {sections.shop && <EcommerceShop config={config} />}
          {sections.featured && <EcommerceFeatured config={config} />}
          {sections.about && <EcommerceAbout config={config} />}
          {sections.testimonials && <EcommerceTestimonials config={config} />}
        </main>
        <EcommerceFooter config={config} />

        {cartOpen && (
          <CartDrawer
            config={config}
            onClose={() => setCartOpen(false)}
            onCheckout={() => {
              setCartOpen(false)
              setCheckoutOpen(true)
            }}
          />
        )}
        {checkoutOpen && <CheckoutDialog config={config} onClose={() => setCheckoutOpen(false)} />}
      </div>
    </CartProvider>
  )
}
