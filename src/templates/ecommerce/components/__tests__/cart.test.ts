import { describe, expect, it } from 'vitest'
import { parseEcommerceConfig } from '../../schema'
import {
  EMPTY_CART,
  addLine,
  canAddToCart,
  clearCart,
  computeCartTotals,
  getLineId,
  getMaxQuantity,
  getUnitPriceMinor,
  isValidVariantSelection,
  parseCartStorage,
  reconcileCart,
  removeLine,
  shippingPriceMinor,
  updateLineQuantity,
} from '../cart'

function product(overrides: Record<string, unknown> = {}) {
  const config = parseEcommerceConfig({ shop: { products: [{ name: 'Test Product', price: 20, ...overrides }] } })
  return config.shop.products[0]
}

describe('getLineId', () => {
  it('is stable regardless of key insertion order in the variant selection', () => {
    const a = getLineId('mug', { Size: 'M', Color: 'Blue' })
    const b = getLineId('mug', { Color: 'Blue', Size: 'M' })
    expect(a).toBe(b)
  })

  it('differs for different variant selections of the same product', () => {
    const a = getLineId('mug', { Size: 'M' })
    const b = getLineId('mug', { Size: 'L' })
    expect(a).not.toBe(b)
  })
})

describe('canAddToCart / getMaxQuantity', () => {
  it('is addable when priced and not out of stock', () => {
    expect(canAddToCart(product())).toBe(true)
  })

  it('is not addable without a price', () => {
    const noPrice = parseEcommerceConfig({ shop: { products: [{ name: 'No price' }] } }).shop.products[0]
    expect(canAddToCart(noPrice)).toBe(false)
  })

  it('is not addable when out of stock, and max quantity is 0', () => {
    const p = product({ stock: { status: 'out-of-stock' } })
    expect(canAddToCart(p)).toBe(false)
    expect(getMaxQuantity(p)).toBe(0)
  })

  it('has no quantity limit when none is configured', () => {
    expect(getMaxQuantity(product())).toBeUndefined()
  })

  it('respects a configured demo stock quantity limit', () => {
    const p = product({ stock: { status: 'low-stock', quantity: 3 } })
    expect(getMaxQuantity(p)).toBe(3)
  })
})

describe('getUnitPriceMinor', () => {
  it('uses the regular price in minor units when there is no valid sale price', () => {
    expect(getUnitPriceMinor(product({ price: 19.99 }))).toBe(1999)
  })

  it('uses the sale price when one is valid', () => {
    expect(getUnitPriceMinor(product({ price: 50, salePrice: 40 }))).toBe(4000)
  })

  it('is 0 for a product with no price at all', () => {
    const noPrice = parseEcommerceConfig({ shop: { products: [{ name: 'No price' }] } }).shop.products[0]
    expect(getUnitPriceMinor(noPrice)).toBe(0)
  })
})

describe('isValidVariantSelection', () => {
  it('requires exactly one valid option per configured variant', () => {
    const p = product({ variants: [{ name: 'Size', options: ['S', 'M', 'L'] }] })
    expect(isValidVariantSelection(p, { Size: 'M' })).toBe(true)
    expect(isValidVariantSelection(p, { Size: 'XL' })).toBe(false)
    expect(isValidVariantSelection(p, {})).toBe(false)
    expect(isValidVariantSelection(p, { Size: 'M', Color: 'Blue' })).toBe(false)
  })

  it('accepts an empty selection for a product with no variants', () => {
    expect(isValidVariantSelection(product(), {})).toBe(true)
  })
})

describe('addLine', () => {
  it('adds a new line for a priced, in-stock product', () => {
    const next = addLine(EMPTY_CART, product(), {}, 1)
    expect(next.lines).toHaveLength(1)
    expect(next.lines[0].quantity).toBe(1)
  })

  it('refuses to add an unaddable product (no price, or out of stock)', () => {
    const noPrice = parseEcommerceConfig({ shop: { products: [{ name: 'No price' }] } }).shop.products[0]
    expect(addLine(EMPTY_CART, noPrice, {}, 1)).toBe(EMPTY_CART)

    const outOfStock = product({ stock: { status: 'out-of-stock' } })
    expect(addLine(EMPTY_CART, outOfStock, {}, 1).lines).toHaveLength(0)
  })

  it('merges into the existing line when the same product/variant is added again', () => {
    const p = product()
    const once = addLine(EMPTY_CART, p, {}, 1)
    const twice = addLine(once, p, {}, 2)
    expect(twice.lines).toHaveLength(1)
    expect(twice.lines[0].quantity).toBe(3)
  })

  it('treats two different variant selections of the same product as separate lines', () => {
    const p = product({ variants: [{ name: 'Size', options: ['S', 'M'] }] })
    const withS = addLine(EMPTY_CART, p, { Size: 'S' }, 1)
    const withBoth = addLine(withS, p, { Size: 'M' }, 1)
    expect(withBoth.lines).toHaveLength(2)
  })

  it('clamps the added quantity to a configured demo stock limit', () => {
    const p = product({ stock: { status: 'low-stock', quantity: 2 } })
    const next = addLine(EMPTY_CART, p, {}, 10)
    expect(next.lines[0].quantity).toBe(2)
  })
})

describe('updateLineQuantity', () => {
  it('updates the quantity of an existing line', () => {
    const p = product()
    const cart = addLine(EMPTY_CART, p, {}, 1)
    const lineId = getLineId(p.slug!, {})
    const next = updateLineQuantity(cart, lineId, 5, undefined)
    expect(next.lines[0].quantity).toBe(5)
  })

  it('removes the line entirely when the quantity drops to 0 or below', () => {
    const p = product()
    const cart = addLine(EMPTY_CART, p, {}, 1)
    const lineId = getLineId(p.slug!, {})
    const next = updateLineQuantity(cart, lineId, 0, undefined)
    expect(next.lines).toHaveLength(0)
  })

  it('clamps an update to a configured demo stock limit', () => {
    const p = product({ stock: { status: 'low-stock', quantity: 3 } })
    const cart = addLine(EMPTY_CART, p, {}, 1)
    const lineId = getLineId(p.slug!, {})
    const next = updateLineQuantity(cart, lineId, 100, 3)
    expect(next.lines[0].quantity).toBe(3)
  })
})

describe('removeLine / clearCart', () => {
  it('removes exactly the targeted line', () => {
    const p1 = product({ name: 'One' })
    const p2 = product({ name: 'Two' })
    let cart = addLine(EMPTY_CART, p1, {}, 1)
    cart = addLine(cart, p2, {}, 1)
    const next = removeLine(cart, getLineId(p1.slug!, {}))
    expect(next.lines).toHaveLength(1)
    expect(next.lines[0].productSlug).toBe(p2.slug)
  })

  it('clears every line', () => {
    const cart = addLine(EMPTY_CART, product(), {}, 1)
    expect(clearCart()).toEqual(EMPTY_CART)
    expect(cart.lines.length).toBeGreaterThan(0) // sanity check the fixture actually had a line
  })
})

describe('reconcileCart', () => {
  it('drops a line whose product no longer exists in the current product list', () => {
    const cart = { lines: [{ productSlug: 'ghost-product', variantSelection: {}, quantity: 1 }] }
    expect(reconcileCart(cart, []).lines).toHaveLength(0)
  })

  it('drops a line whose variant selection no longer matches the product (e.g. a removed option)', () => {
    const p = product({ variants: [{ name: 'Size', options: ['S', 'M'] }] })
    const cart = { lines: [{ productSlug: p.slug!, variantSelection: { Size: 'XL' }, quantity: 1 }] }
    expect(reconcileCart(cart, [p]).lines).toHaveLength(0)
  })

  it('drops a line for a product that has since gone out of stock', () => {
    const p = product({ stock: { status: 'out-of-stock' } })
    const cart = { lines: [{ productSlug: p.slug!, variantSelection: {}, quantity: 1 }] }
    expect(reconcileCart(cart, [p]).lines).toHaveLength(0)
  })

  it('clamps quantity down to a reduced stock limit, keeping the line', () => {
    const p = product({ stock: { status: 'low-stock', quantity: 2 } })
    const cart = { lines: [{ productSlug: p.slug!, variantSelection: {}, quantity: 10 }] }
    const next = reconcileCart(cart, [p])
    expect(next.lines).toHaveLength(1)
    expect(next.lines[0].quantity).toBe(2)
  })

  it('keeps a valid, in-stock line untouched', () => {
    const p = product()
    const cart = { lines: [{ productSlug: p.slug!, variantSelection: {}, quantity: 2 }] }
    expect(reconcileCart(cart, [p])).toEqual(cart)
  })
})

describe('computeCartTotals', () => {
  it('sums line totals and item counts in integer minor units, avoiding float drift', () => {
    // 0.1 + 0.2 famously isn't 0.3 in float math — this exercises exactly that shape.
    const p1 = product({ name: 'One', price: 0.1 })
    const p2 = product({ name: 'Two', price: 0.2 })
    let cart = addLine(EMPTY_CART, p1, {}, 1)
    cart = addLine(cart, p2, {}, 1)
    const totals = computeCartTotals(cart, [p1, p2])
    expect(totals.subtotalMinor).toBe(30)
    expect(totals.itemCount).toBe(2)
  })

  it('multiplies unit price by quantity per line', () => {
    const p = product({ price: 10 })
    const cart = addLine(EMPTY_CART, p, {}, 3)
    const totals = computeCartTotals(cart, [p])
    expect(totals.items[0].lineTotalMinor).toBe(3000)
    expect(totals.subtotalMinor).toBe(3000)
  })

  it('is empty for an empty cart', () => {
    const totals = computeCartTotals(EMPTY_CART, [])
    expect(totals.items).toEqual([])
    expect(totals.itemCount).toBe(0)
    expect(totals.subtotalMinor).toBe(0)
  })

  it('skips a line whose product cannot be found (defensive — should already be reconciled away)', () => {
    const cart = { lines: [{ productSlug: 'missing', variantSelection: {}, quantity: 1 }] }
    const totals = computeCartTotals(cart, [])
    expect(totals.items).toEqual([])
    expect(totals.subtotalMinor).toBe(0)
  })
})

describe('parseCartStorage', () => {
  it('parses a valid persisted cart', () => {
    const raw = { lines: [{ productSlug: 'mug', variantSelection: { Color: 'Blue' }, quantity: 2 }] }
    expect(parseCartStorage(raw)).toEqual(raw)
  })

  it('falls back to an empty cart for malformed/garbage input', () => {
    expect(parseCartStorage('not an object')).toEqual(EMPTY_CART)
    expect(parseCartStorage(null)).toEqual(EMPTY_CART)
    expect(parseCartStorage({ lines: 'not an array' })).toEqual(EMPTY_CART)
    expect(parseCartStorage({ lines: [{ productSlug: 'mug', quantity: -1 }] })).toEqual(EMPTY_CART)
  })

  it('defaults a missing variantSelection to an empty object rather than failing the line', () => {
    const raw = { lines: [{ productSlug: 'mug', quantity: 1 }] }
    expect(parseCartStorage(raw).lines[0].variantSelection).toEqual({})
  })
})

describe('shippingPriceMinor', () => {
  it('converts a shipping option price to minor units', () => {
    expect(shippingPriceMinor({ label: 'Standard', price: 6.5 })).toBe(650)
  })

  it('treats a shipping option with no price as free', () => {
    expect(shippingPriceMinor({ label: 'Pickup' })).toBe(0)
  })
})
