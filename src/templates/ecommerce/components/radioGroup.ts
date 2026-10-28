import type { KeyboardEvent } from 'react'

/**
 * Minimal WAI-ARIA radio-group keyboard controller for `<button role="radio">`
 * option pills (used for variant selection — "Size", "Color", etc. — where a native
 * `<input type="radio">` can't be styled as a pill without extra wrapper markup).
 * Duplicated, not imported from the factory dashboard: every exported site is a
 * self-contained copy of only its own `src/templates/<family>/` directory (see
 * scripts/buildExportManifest.ts), so this family can't depend on factory-only code
 * living outside it. Implements the roving-tabindex pattern: only the checked option
 * (or the first enabled one) is in the tab sequence, arrow keys move focus and
 * selection together, Home/End jump to the first/last option, and disabled options are
 * skipped. Pointer clicks are untouched — the caller keeps its own `onClick`.
 */
export function createRadioGroupController<T extends string>({
  value,
  onChange,
  values,
  itemRefs,
}: {
  value: T
  onChange: (value: T) => void
  values: readonly T[]
  itemRefs: Map<T, HTMLButtonElement>
}) {
  const tabbableValue = values.includes(value) ? value : values[0]

  function focusAndSelect(v: T | undefined) {
    if (v === undefined) return
    onChange(v)
    itemRefs.get(v)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (values.length === 0) return
    const currentIndex = values.indexOf(tabbableValue)

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        focusAndSelect(values[(currentIndex + 1) % values.length])
        break
      case 'ArrowLeft':
        event.preventDefault()
        focusAndSelect(values[(currentIndex - 1 + values.length) % values.length])
        break
      case 'Home':
        event.preventDefault()
        focusAndSelect(values[0])
        break
      case 'End':
        event.preventDefault()
        focusAndSelect(values[values.length - 1])
        break
      case ' ':
      case 'Spacebar': {
        const target = event.target as HTMLElement
        const targetValue = target.dataset.radioValue as T | undefined
        if (targetValue) {
          event.preventDefault()
          onChange(targetValue)
        }
        break
      }
    }
  }

  function getItemProps(v: T) {
    return {
      ref: (el: HTMLButtonElement | null) => {
        if (el) itemRefs.set(v, el)
        else itemRefs.delete(v)
      },
      role: 'radio' as const,
      'aria-checked': value === v,
      tabIndex: v === tabbableValue ? 0 : -1,
      'data-radio-value': v,
    }
  }

  return {
    groupProps: { role: 'radiogroup' as const, onKeyDown: handleKeyDown },
    getItemProps,
  }
}
