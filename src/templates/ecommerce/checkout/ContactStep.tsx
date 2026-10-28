import { useState, type FormEvent } from 'react'
import type { CheckoutContactInfo } from './types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  value: CheckoutContactInfo
  onNext: (value: CheckoutContactInfo) => void
}

export function ContactStep({ value, onNext }: Props) {
  const [name, setName] = useState(value.name)
  const [email, setEmail] = useState(value.email)
  const [phone, setPhone] = useState(value.phone)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: { name?: string; email?: string } = {}
    if (name.trim() === '') nextErrors.name = 'Enter your name.'
    if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onNext({ name: name.trim(), email: email.trim(), phone: phone.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-[family-name:var(--site-font-display)] text-xl font-semibold">Contact details</h3>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-[var(--site-danger)]">
          Please fix the highlighted fields.
        </p>
      )}
      <div className="space-y-1">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Full name</span>
          <input
            className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'checkout-name-error' : undefined}
          />
        </label>
        {errors.name && (
          <span id="checkout-name-error" className="text-xs text-[var(--site-danger)]">
            {errors.name}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'checkout-email-error' : undefined}
          />
        </label>
        {errors.email && (
          <span id="checkout-email-error" className="text-xs text-[var(--site-danger)]">
            {errors.email}
          </span>
        )}
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Phone (optional)</span>
        <input className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button type="submit" className="w-full rounded-full bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] hover:bg-[var(--site-accent-strong)]">
        Continue to shipping
      </button>
    </form>
  )
}
