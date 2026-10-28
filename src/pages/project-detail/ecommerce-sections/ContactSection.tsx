import { X } from 'lucide-react'
import type { EcommerceConfig } from '../../../templates/ecommerce'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

export function ContactSection({ config, onChange, disabled }: Props) {
  const { contact } = config
  const social = contact.social

  function updateSocial(index: number, field: 'label' | 'href', value: string) {
    onChange({ ...config, contact: { ...contact, social: social.map((s, i) => (i === index ? { ...s, [field]: value } : s)) } })
  }

  function removeSocial(index: number) {
    onChange({ ...config, contact: { ...contact, social: social.filter((_, i) => i !== index) } })
  }

  function addSocial() {
    if (social.length >= 6) return
    onChange({ ...config, contact: { ...contact, social: [...social, { label: 'Instagram', href: 'https://' }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Contact</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Email</span>
          <input className={inputClass} value={contact.email ?? ''} disabled={disabled} onChange={(e) => onChange({ ...config, contact: { ...contact, email: e.target.value } })} />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Phone</span>
          <input className={inputClass} value={contact.phone ?? ''} disabled={disabled} onChange={(e) => onChange({ ...config, contact: { ...contact, phone: e.target.value } })} />
        </label>
      </div>

      <div className="space-y-2">
        <span className={labelClass}>Social links (optional)</span>
        {social.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input className={inputClass} placeholder="Label (e.g. Instagram)" aria-label={`Social link ${index + 1} label`} value={item.label} disabled={disabled} onChange={(e) => updateSocial(index, 'label', e.target.value)} />
            <input className={inputClass} placeholder="https://…" aria-label={`Social link ${index + 1} URL`} value={item.href} disabled={disabled} onChange={(e) => updateSocial(index, 'href', e.target.value)} />
            <button type="button" disabled={disabled} onClick={() => removeSocial(index)} aria-label={`Remove social link ${index + 1}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60">
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {social.length < 6 && (
          <button type="button" disabled={disabled} onClick={addSocial} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
            Add link
          </button>
        )}
      </div>
    </fieldset>
  )
}
