import { X } from 'lucide-react'
import { inputClass, labelClass } from '../formStyles'

interface Props {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  itemAriaLabel: (index: number) => string
  addLabel?: string
  max?: number
  disabled?: boolean
}

/**
 * A repeatable list of plain strings (image URLs, badges, tags/tools, variant
 * options) with per-row add/remove and an accessible label on every input —
 * replacing the newline/comma-separated textarea pattern that made these collections
 * hard to edit without silently mangling entries (a stray comma inside a value, or a
 * blank line, used to be indistinguishable from a real separator). Reorder isn't
 * offered here since these are typically unordered sets (badges, tags, image
 * alternatives); ordered collections (products, listings, projects) keep their own
 * move-up/move-down controls.
 */
export function StringListField({ label, items, onChange, placeholder, itemAriaLabel, addLabel, max, disabled }: Props) {
  function updateItem(index: number, value: string) {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    if (max !== undefined && items.length >= max) return
    onChange([...items, ''])
  }

  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              className={inputClass}
              placeholder={placeholder}
              aria-label={itemAriaLabel(index)}
              value={item}
              disabled={disabled}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeItem(index)}
              aria-label={`Remove ${itemAriaLabel(index).toLowerCase()}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {(max === undefined || items.length < max) && (
        <button
          type="button"
          disabled={disabled}
          onClick={addItem}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          {addLabel ?? `Add ${label.toLowerCase()}`}
        </button>
      )}
    </div>
  )
}
