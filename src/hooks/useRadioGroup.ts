import { useState, type KeyboardEvent } from 'react'

type Orientation = 'horizontal' | 'vertical'

interface RadioGroupArgs<T extends string> {
  value: T
  onChange: (value: T) => void
  values: readonly T[]
  disabledValues?: readonly T[]
  orientation?: Orientation
}

/**
 * Pure (non-hook) controller behind `useRadioGroup` below — takes an already-created
 * ref map instead of making its own, so a component that renders a *variable* number
 * of independent radio groups (e.g. one per product variant) can create one ref map
 * per group with a single top-level `useRef` call and build each group's controller
 * in a loop, without breaking the rules of hooks (`useRadioGroup` itself can't be
 * called a variable number of times per render).
 */
export function createRadioGroupController<T extends string>({
  value,
  onChange,
  values,
  disabledValues,
  orientation = 'horizontal',
  itemRefs,
}: RadioGroupArgs<T> & { itemRefs: Map<T, HTMLButtonElement> }) {
  const isDisabled = (v: T) => disabledValues?.includes(v) ?? false
  const enabledValues = values.filter((v) => !isDisabled(v))
  const tabbableValue = enabledValues.includes(value) ? value : enabledValues[0]

  function focusAndSelect(v: T | undefined) {
    if (v === undefined) return
    onChange(v)
    itemRefs.get(v)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (enabledValues.length === 0) return
    const currentIndex = enabledValues.indexOf(tabbableValue)
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'

    switch (event.key) {
      case nextKey:
        event.preventDefault()
        focusAndSelect(enabledValues[(currentIndex + 1) % enabledValues.length])
        break
      case prevKey:
        event.preventDefault()
        focusAndSelect(enabledValues[(currentIndex - 1 + enabledValues.length) % enabledValues.length])
        break
      case 'Home':
        event.preventDefault()
        focusAndSelect(enabledValues[0])
        break
      case 'End':
        event.preventDefault()
        focusAndSelect(enabledValues[enabledValues.length - 1])
        break
      case ' ':
      case 'Spacebar': {
        const target = event.target as HTMLElement
        const targetValue = target.dataset.radioValue as T | undefined
        if (targetValue && !isDisabled(targetValue)) {
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
      disabled: isDisabled(v),
      'data-radio-value': v,
    }
  }

  return {
    groupProps: { role: 'radiogroup' as const, onKeyDown: handleKeyDown },
    getItemProps,
  }
}

/**
 * Shared keyboard/focus behavior for a WAI-ARIA radio-group built from `<button
 * role="radio">` elements rather than native `<input type="radio">` (used where a
 * native radio's default styling can't be overridden enough — e.g. icon-only toggles,
 * pill-shaped option buttons). Implements the roving-tabindex pattern: only the
 * checked option (or the first enabled option, if none is checked) sits in the tab
 * sequence; arrow keys move focus AND selection together ("selection follows focus",
 * the standard radio-group model), Home/End jump to the first/last enabled option, and
 * disabled options are skipped. Pointer clicks are untouched — callers keep their own
 * `onClick`.
 *
 * One implementation, reused by every `role="radiogroup"` in the app, so the keyboard
 * behavior only needs to be correct (and tested) once. For a component that renders a
 * variable number of groups (e.g. one per product variant), use
 * `createRadioGroupController` directly with your own ref map instead.
 */
export function useRadioGroup<T extends string>(args: RadioGroupArgs<T>) {
  const [itemRefs] = useState(() => new Map<T, HTMLButtonElement>())
  return createRadioGroupController({ ...args, itemRefs })
}
