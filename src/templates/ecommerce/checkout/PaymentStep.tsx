interface Props {
  onBack: () => void
  onComplete: () => void
}

/**
 * Payment choices are shown for context — Paystack and Stripe as the planned future
 * providers (see README.md's "Future Paystack/Stripe integration boundary" section)
 * — but both are disabled, unselectable, and load no SDK or network call of any
 * kind. The only enabled path is the explicit demo completion, which this component
 * labels honestly: it never says "payment successful" or "order placed."
 */
export function PaymentStep({ onBack, onComplete }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="font-[family-name:var(--site-font-display)] text-xl font-semibold">Payment</h3>
      <p className="text-sm text-[var(--site-text-muted)]">
        This store is a demonstration. No real payment is collected — card numbers, bank details, and mobile-money PINs are
        never requested here.
      </p>

      <fieldset>
        <legend className="text-sm font-medium">Payment method</legend>
        <div role="radiogroup" aria-label="Payment method" className="mt-2 space-y-2">
          <label className="flex items-center gap-2 rounded-md border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text-faint)] opacity-60">
            <input type="radio" name="payment-method" disabled />
            Paystack (coming soon — not available in this demo)
          </label>
          <label className="flex items-center gap-2 rounded-md border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text-faint)] opacity-60">
            <input type="radio" name="payment-method" disabled />
            Stripe (coming soon — not available in this demo)
          </label>
          <label className="flex items-center gap-2 rounded-md border border-[var(--site-accent)] bg-[var(--site-accent)]/10 px-3 py-2 text-sm">
            <input type="radio" name="payment-method" checked readOnly />
            Demo checkout (no payment taken)
          </label>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-full border border-[var(--site-border)] px-5 py-3 text-sm font-medium hover:border-[var(--site-accent)]">
          Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 rounded-full bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] hover:bg-[var(--site-accent-strong)]"
        >
          Complete demo checkout
        </button>
      </div>
    </div>
  )
}
