import { X } from 'lucide-react'
import { inputClass, labelClass } from '../formStyles'
import { StringListField } from './StringListField'

export interface Variant {
  name: string
  options: string[]
}

interface Props {
  items: Variant[]
  onChange: (next: Variant[]) => void
  itemAriaLabel: (index: number) => string
  disabled?: boolean
  max?: number
}

/**
 * A repeatable list of product variants (e.g. "Size: S, M, L"), each with a
 * name and its own nested option list — replacing a textarea line format
 * that silently dropped a variant's options if its name happened to
 * contain a comma.
 */
export function VariantListField({ items, onChange, itemAriaLabel, disabled, max }: Props) {
  function update(index: number, patch: Partial<Variant>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function add() {
    if (max !== undefined && items.length >= max) return
    onChange([...items, { name: '', options: [''] }])
  }

  return (
    <div className="space-y-2">
      <span className={labelClass}>Variants</span>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border border-border-strong p-2">
            <div className="flex items-center gap-2">
              <input
                className={`${inputClass} flex-1`}
                placeholder="Variant name (e.g. Size)"
                aria-label={`${itemAriaLabel(index)} name`}
                value={item.name}
                disabled={disabled}
                onChange={(e) => update(index, { name: e.target.value })}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={`Remove ${itemAriaLabel(index).toLowerCase()}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2">
              <StringListField
                label="Options"
                items={item.options}
                onChange={(options) => update(index, { options })}
                placeholder="e.g. Small"
                itemAriaLabel={(optIndex) => `${itemAriaLabel(index)} option ${optIndex + 1}`}
                addLabel="Add option"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>
      {(max === undefined || items.length < max) && (
        <button
          type="button"
          disabled={disabled}
          onClick={add}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add variant
        </button>
      )}
    </div>
  )
}
