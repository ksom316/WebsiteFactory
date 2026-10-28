import { X } from 'lucide-react'
import type { EcommerceConfig } from '../../../templates/ecommerce'
import { fieldsetClass, helpTextClass, inputClass, legendClass } from '../formStyles'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

export function TestimonialsSection({ config, onChange, disabled }: Props) {
  const { testimonials } = config

  function updateTestimonial(index: number, field: 'quote' | 'author' | 'role', value: string) {
    onChange({ ...config, testimonials: testimonials.map((t, i) => (i === index ? { ...t, [field]: value } : t)) })
  }

  function removeTestimonial(index: number) {
    onChange({ ...config, testimonials: testimonials.filter((_, i) => i !== index) })
  }

  function addTestimonial() {
    if (testimonials.length >= 6) return
    onChange({ ...config, testimonials: [...testimonials, { quote: '', author: 'New customer' }] })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Testimonials</legend>
      <p className={helpTextClass}>Keep sample/placeholder testimonials clearly marked as illustrative, not real endorsements.</p>

      <div className="space-y-3">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="flex items-start gap-2 rounded-md border border-border-strong p-2">
            <div className="flex-1 space-y-1.5">
              <textarea className={`${inputClass} min-h-16`} placeholder="Quote" aria-label={`Testimonial ${index + 1} quote`} value={testimonial.quote} disabled={disabled} onChange={(e) => updateTestimonial(index, 'quote', e.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={inputClass} placeholder="Author" aria-label={`Testimonial ${index + 1} author`} value={testimonial.author} disabled={disabled} onChange={(e) => updateTestimonial(index, 'author', e.target.value)} />
                <input className={inputClass} placeholder="Role (optional)" aria-label={`Testimonial ${index + 1} role`} value={testimonial.role ?? ''} disabled={disabled} onChange={(e) => updateTestimonial(index, 'role', e.target.value)} />
              </div>
            </div>
            <button type="button" disabled={disabled} onClick={() => removeTestimonial(index)} aria-label={`Remove testimonial ${index + 1}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60">
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {testimonials.length < 6 && (
        <button type="button" disabled={disabled} onClick={addTestimonial} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
          Add testimonial
        </button>
      )}
    </fieldset>
  )
}
