import { useEffect, useRef, useState } from 'react'
import type { EcommerceConfig } from '../schema'
import { useCart } from '../components/useCart'
import { ContactStep } from './ContactStep'
import { ShippingStep } from './ShippingStep'
import { ReviewStep } from './ReviewStep'
import { PaymentStep } from './PaymentStep'
import { ConfirmationStep } from './ConfirmationStep'
import { generateDemoOrderReference } from './orderReference'
import type { CheckoutAddress, CheckoutContactInfo, CheckoutStep } from './types'

const EMPTY_CONTACT: CheckoutContactInfo = { name: '', email: '', phone: '' }
const EMPTY_ADDRESS: CheckoutAddress = { line1: '', city: '', postalCode: '', country: '' }

interface Props {
  config: EcommerceConfig
  onClose: () => void
}

/**
 * The entire simulated checkout — a dialog, not a route, for the same reason as the
 * product detail dialog (no router dependency, identical behavior in the factory
 * preview and a static export). Customer contact/address input lives ONLY in this
 * component's own state (`contact`/`address` below) — never in the cart context,
 * never in localStorage, never sent anywhere — so closing this dialog for any reason
 * (cancel, Escape, completing the demo) unmounts it and discards that input
 * automatically. See README.md's "Customer data" note for the full rationale.
 */
export function CheckoutDialog({ config, onClose }: Props) {
  const { totals, clear } = useCart()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [step, setStep] = useState<CheckoutStep>('contact')
  const [contact, setContact] = useState<CheckoutContactInfo>(EMPTY_CONTACT)
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS)
  const [shippingIndex, setShippingIndex] = useState(0)
  const [orderReference, setOrderReference] = useState('')

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [step])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const shippingOption = config.checkout.shippingOptions[shippingIndex] ?? config.checkout.shippingOptions[0]

  function handleComplete() {
    setOrderReference(generateDemoOrderReference())
    // The demo cart is cleared once the simulated order is "placed" — exactly what a
    // real checkout would do, even though nothing was actually ordered or charged.
    clear()
    setStep('confirmation')
  }

  if (totals.items.length === 0 && step !== 'confirmation') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div role="dialog" aria-modal="true" className="wf-ecommerce w-full max-w-md rounded-xl bg-[var(--site-surface)] p-6 text-center">
          <p className="text-sm text-[var(--site-text-muted)]">Your cart is empty.</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="mt-4 rounded-full border border-[var(--site-border)] px-5 py-2.5 text-sm font-medium hover:border-[var(--site-accent)]"
          >
            Back to store
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Checkout" className="wf-ecommerce max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[var(--site-surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-[var(--site-text-faint)]">{config.checkout.demoNotice}</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="shrink-0 rounded-md border border-[var(--site-border)] px-2.5 py-1.5 text-sm text-[var(--site-text-muted)] hover:text-[var(--site-text)]"
          >
            Close
          </button>
        </div>

        {step === 'contact' && <ContactStep value={contact} onNext={(value) => { setContact(value); setStep('shipping') }} />}

        {step === 'shipping' && (
          <ShippingStep
            value={address}
            shippingOptions={config.checkout.shippingOptions}
            selectedShippingIndex={shippingIndex}
            currency={config.shop.currency}
            onBack={() => setStep('contact')}
            onNext={(nextAddress, nextShippingIndex) => {
              setAddress(nextAddress)
              setShippingIndex(nextShippingIndex)
              setStep('review')
            }}
          />
        )}

        {step === 'review' && shippingOption && (
          <ReviewStep
            contact={contact}
            address={address}
            shippingOption={shippingOption}
            currency={config.shop.currency}
            demoNotice={config.checkout.demoNotice}
            onBack={() => setStep('shipping')}
            onNext={() => setStep('payment')}
          />
        )}

        {step === 'payment' && <PaymentStep onBack={() => setStep('review')} onComplete={handleComplete} />}

        {step === 'confirmation' && (
          <ConfirmationStep
            orderReference={orderReference}
            confirmationMessage={config.checkout.confirmationMessage}
            demoNotice={config.checkout.demoNotice}
            onReturn={onClose}
          />
        )}
      </div>
    </div>
  )
}
