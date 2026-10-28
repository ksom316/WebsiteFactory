import { z } from 'zod'
import type { EcommerceConfig, EcommerceProduct } from '../schema'
import { toMinorUnits } from './currency'

/**
 * Pure cart logic — no React, no storage I/O — so it can be unit tested directly and
 * reused identically between the factory preview and the standalone export (see
 * CartContext.tsx, which is the only thing that wires this to React state +
 * localStorage). Everything here is DEMO-ONLY: no price here is authoritative for a
 * real transaction — see README.md's "E-commerce storefront template family" section.
 */

export interface CartLine {
  productSlug: string
  /** e.g. { Size: 'M', Color: 'Blue' } — empty object for a product with no variants. */
  variantSelection: Record<string, string>
  quantity: number
}

export interface CartState {
  lines: CartLine[]
}

export const EMPTY_CART: CartState = { lines: [] }

/** A line's stable identity — a product with two different variant selections is two
 * distinct cart lines, exactly as the brief requires. */
export function getLineId(productSlug: string, variantSelection: Record<string, string>): string {
  const sortedEntries = Object.entries(variantSelection).sort(([a], [b]) => a.localeCompare(b))
  return `${productSlug}::${sortedEntries.map(([k, v]) => `${k}=${v}`).join('|')}`
}

/** The highest quantity a visitor may hold of one cart line for this product —
 * `undefined` means no configured limit. An out-of-stock product always maxes at 0,
 * which `canAddToCart` below uses to refuse adding it at all. This is demo stock data
 * only, not a real inventory check. */
export function getMaxQuantity(product: EcommerceProduct): number | undefined {
  if (product.stock.status === 'out-of-stock') return 0
  return product.stock.quantity
}

/** A product needs a usable price and in-stock demo status to be addable — a
 * priceless product (shown with the catalog-style "contact for price" message) or an
 * out-of-stock one simply has no Add to Cart action, rather than adding a $0 line or a
 * line that immediately violates its own stock limit. */
export function canAddToCart(product: EcommerceProduct): boolean {
  if (product.price === undefined) return false
  return getMaxQuantity(product) !== 0
}

/** The unit price actually charged — the sale price when one is valid (the schema has
 * already dropped any sale price that isn't strictly lower than the regular price),
 * otherwise the regular price, in integer minor units. */
export function getUnitPriceMinor(product: EcommerceProduct): number {
  const amount = product.salePrice ?? product.price ?? 0
  return toMinorUnits(amount)
}

/** Validates that a chosen variant selection is exactly one valid option per variant
 * the product defines — used both when adding to cart and when reconciling persisted
 * cart data against the current product list (see reconcileCart). */
export function isValidVariantSelection(product: EcommerceProduct, selection: Record<string, string>): boolean {
  if (product.variants.length !== Object.keys(selection).length) return false
  return product.variants.every((variant) => variant.options.includes(selection[variant.name]))
}

function clampQuantity(quantity: number, max: number | undefined): number {
  const atLeastOne = Math.max(1, Math.floor(quantity))
  return max === undefined ? atLeastOne : Math.min(atLeastOne, max)
}

export function addLine(
  state: CartState,
  product: EcommerceProduct,
  variantSelection: Record<string, string>,
  quantity: number,
): CartState {
  if (!canAddToCart(product)) return state
  const lineId = getLineId(product.slug!, variantSelection)
  const max = getMaxQuantity(product)
  const existing = state.lines.find((line) => getLineId(line.productSlug, line.variantSelection) === lineId)

  if (existing) {
    return {
      lines: state.lines.map((line) =>
        getLineId(line.productSlug, line.variantSelection) === lineId
          ? { ...line, quantity: clampQuantity(line.quantity + quantity, max) }
          : line,
      ),
    }
  }

  return { lines: [...state.lines, { productSlug: product.slug!, variantSelection, quantity: clampQuantity(quantity, max) }] }
}

export function updateLineQuantity(state: CartState, lineId: string, quantity: number, max: number | undefined): CartState {
  if (quantity <= 0) return removeLine(state, lineId)
  return {
    lines: state.lines.map((line) =>
      getLineId(line.productSlug, line.variantSelection) === lineId ? { ...line, quantity: clampQuantity(quantity, max) } : line,
    ),
  }
}

export function removeLine(state: CartState, lineId: string): CartState {
  return { lines: state.lines.filter((line) => getLineId(line.productSlug, line.variantSelection) !== lineId) }
}

export function clearCart(): CartState {
  return EMPTY_CART
}

/**
 * Reconciles persisted cart lines against the CURRENT configured product list — a
 * line is dropped entirely if its product no longer exists or its variant selection
 * no longer matches that product's configured variants, and otherwise its quantity is
 * clamped to the product's current demo stock limit. This runs every time a persisted
 * cart is loaded (see CartContext.tsx), so an edited catalog or emptied stock can never
 * leave a visitor's cart pointing at something that no longer makes sense.
 */
export function reconcileCart(state: CartState, products: EcommerceProduct[]): CartState {
  const bySlug = new Map(products.map((p) => [p.slug!, p]))
  const lines: CartLine[] = []
  for (const line of state.lines) {
    const product = bySlug.get(line.productSlug)
    if (!product) continue
    if (!isValidVariantSelection(product, line.variantSelection)) continue
    const max = getMaxQuantity(product)
    if (max === 0) continue
    lines.push({ ...line, quantity: clampQuantity(line.quantity, max) })
  }
  return { lines }
}

export interface CartLineTotal {
  line: CartLine
  product: EcommerceProduct
  unitPriceMinor: number
  lineTotalMinor: number
}

export interface CartTotals {
  items: CartLineTotal[]
  itemCount: number
  subtotalMinor: number
}

/** Looks up each line's current product (a line surviving `reconcileCart` is
 * guaranteed to have one) and sums in integer minor units throughout — see
 * currency.ts's header comment for why. */
export function computeCartTotals(state: CartState, products: EcommerceProduct[]): CartTotals {
  const bySlug = new Map(products.map((p) => [p.slug!, p]))
  const items: CartLineTotal[] = []
  let subtotalMinor = 0
  let itemCount = 0

  for (const line of state.lines) {
    const product = bySlug.get(line.productSlug)
    if (!product) continue
    const unitPriceMinor = getUnitPriceMinor(product)
    const lineTotalMinor = unitPriceMinor * line.quantity
    items.push({ line, product, unitPriceMinor, lineTotalMinor })
    subtotalMinor += lineTotalMinor
    itemCount += line.quantity
  }

  return { items, itemCount, subtotalMinor }
}

/** The persisted shape in browser storage — validated on load so malformed or
 * tampered-with JSON (or data from a future/past incompatible schema version) safely
 * falls back to an empty cart instead of throwing. Deliberately holds nothing but
 * product slug / variant selection / quantity — never customer details (see
 * README.md's "Customer data" note: checkout input is never written to storage). */
export const cartStorageSchema = z.object({
  lines: z
    .array(
      z.object({
        productSlug: z.string().min(1).max(80),
        variantSelection: z.record(z.string().max(40), z.string().max(40)).default({}),
        quantity: z.number().int().positive().max(100000),
      }),
    )
    .max(200)
    .default([]),
})

export function parseCartStorage(raw: unknown): CartState {
  const result = cartStorageSchema.safeParse(raw)
  return result.success ? result.data : EMPTY_CART
}

export function shippingPriceMinor(option: EcommerceConfig['checkout']['shippingOptions'][number]): number {
  return toMinorUnits(option.price ?? 0)
}
