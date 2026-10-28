import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { RestaurantConfig } from '../../../templates/restaurant'
import { fieldsetClass, inputClass, legendClass } from '../formStyles'

interface Props {
  config: RestaurantConfig
  onChange: (next: RestaurantConfig) => void
  disabled?: boolean
}

export function MenuSection({ config, onChange, disabled }: Props) {
  const { menu } = config
  const categories = menu.categories

  function updateCategoryName(index: number, name: string) {
    onChange({ ...config, menu: { ...menu, categories: categories.map((c, i) => (i === index ? { ...c, name } : c)) } })
  }

  function removeCategory(index: number) {
    onChange({ ...config, menu: { ...menu, categories: categories.filter((_, i) => i !== index) } })
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const next = [...categories]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange({ ...config, menu: { ...menu, categories: next } })
  }

  function addCategory() {
    if (categories.length >= 10) return
    onChange({ ...config, menu: { ...menu, categories: [...categories, { name: 'New category', items: [] }] } })
  }

  function updateItem(categoryIndex: number, itemIndex: number, field: 'name' | 'description' | 'price', value: string) {
    const next = categories.map((category, ci) => {
      if (ci !== categoryIndex) return category
      return { ...category, items: category.items.map((item, ii) => (ii === itemIndex ? { ...item, [field]: value } : item)) }
    })
    onChange({ ...config, menu: { ...menu, categories: next } })
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    const next = categories.map((category, ci) =>
      ci !== categoryIndex ? category : { ...category, items: category.items.filter((_, ii) => ii !== itemIndex) },
    )
    onChange({ ...config, menu: { ...menu, categories: next } })
  }

  function addItem(categoryIndex: number) {
    const next = categories.map((category, ci) => {
      if (ci !== categoryIndex || category.items.length >= 20) return category
      return { ...category, items: [...category.items, { name: 'New item', description: '', price: '' }] }
    })
    onChange({ ...config, menu: { ...menu, categories: next } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Menu</legend>

      <div className="space-y-4">
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <input
                className={`${inputClass} flex-1 font-semibold`}
                aria-label={`Category ${categoryIndex + 1} name`}
                value={category.name}
                disabled={disabled}
                onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || categoryIndex === 0}
                  onClick={() => moveCategory(categoryIndex, -1)}
                  aria-label={`Move category ${categoryIndex + 1} up`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled || categoryIndex === categories.length - 1}
                  onClick={() => moveCategory(categoryIndex, 1)}
                  aria-label={`Move category ${categoryIndex + 1} down`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeCategory(categoryIndex)}
                  aria-label={`Remove category ${categoryIndex + 1}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-2 rounded-md border border-border p-2">
                  <div className="flex-1 space-y-1.5">
                    <input
                      className={inputClass}
                      placeholder="Item name"
                      aria-label={`Item ${itemIndex + 1} name`}
                      value={item.name}
                      disabled={disabled}
                      onChange={(e) => updateItem(categoryIndex, itemIndex, 'name', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        placeholder="Description"
                        aria-label={`Item ${itemIndex + 1} description`}
                        value={item.description ?? ''}
                        disabled={disabled}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, 'description', e.target.value)}
                      />
                      <input
                        className={`${inputClass} w-24 shrink-0`}
                        placeholder="Price"
                        aria-label={`Item ${itemIndex + 1} price`}
                        value={item.price ?? ''}
                        disabled={disabled}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, 'price', e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeItem(categoryIndex, itemIndex)}
                    aria-label={`Remove item ${itemIndex + 1}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {category.items.length < 20 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => addItem(categoryIndex)}
                  className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
                >
                  Add item
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {categories.length < 10 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addCategory}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add category
        </button>
      )}
      <p className="text-sm text-text-muted">{categories.length} / 10 categories</p>
    </fieldset>
  )
}
