import { X } from 'lucide-react'
import { inputClass, labelClass } from '../formStyles'

export interface Attribute {
  label: string
  value: string
}

interface Props {
  label: string
  items: Attribute[]
  onChange: (next: Attribute[]) => void
  itemGroupAriaLabel: (index: number) => string
  disabled?: boolean
  max?: number
}

/**
 * A repeatable list of label/value pairs (e.g. product attributes like
 * "Material: Merino wool") as two labeled inputs per row instead of a
 * "Label: Value" line inside a textarea, which broke silently if the value
 * itself contained a colon.
 */
export function AttributeListField({ label, items, onChange, itemGroupAriaLabel, disabled, max }: Props) {
  function update(index: number, patch: Partial<Attribute>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function add() {
    if (max !== undefined && items.length >= max) return
    onChange([...items, { label: '', value: '' }])
  }

  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              className={`${inputClass} w-1/3`}
              placeholder="Label"
              aria-label={`${itemGroupAriaLabel(index)} label`}
              value={item.label}
              disabled={disabled}
              onChange={(e) => update(index, { label: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Value"
              aria-label={`${itemGroupAriaLabel(index)} value`}
              value={item.value}
              disabled={disabled}
              onChange={(e) => update(index, { value: e.target.value })}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(index)}
              aria-label={`Remove ${itemGroupAriaLabel(index).toLowerCase()}`}
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
          onClick={add}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add {label.toLowerCase()}
        </button>
      )}
    </div>
  )
}
