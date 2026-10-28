import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { EcommerceConfig, EcommerceProduct } from '../schema'
import {
  EMPTY_CART,
  addLine,
  clearCart,
  computeCartTotals,
  getLineId,
  getMaxQuantity,
  parseCartStorage,
  reconcileCart,
  removeLine,
  updateLineQuantity,
  type CartState,
} from './cart'
import { CartContext } from './cartContextValue'

/**
 * The ONLY browser-storage key this family writes to, and the only thing it ever
 * persists: product slug, chosen variant options, and quantity — never customer
 * contact/address/payment details from checkout (see README.md's "Customer data"
 * note). Versioned so a future incompatible cart shape can be migrated/ignored
 * instead of crashing an old stored cart.
 */
const CART_STORAGE_KEY = 'wf-ecommerce-cart-v1'

function loadStoredCart(): CartState {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return EMPTY_CART
    return parseCartStorage(JSON.parse(raw))
  } catch {
    // Malformed JSON, storage disabled (private browsing), or any other storage
    // error — a demo cart is never worth crashing the page over.
    return EMPTY_CART
  }
}

function saveStoredCart(state: CartState): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be full or disabled — the cart still works for the rest of this
    // page view via in-memory state; it just won't survive a refresh.
  }
}

export function CartProvider({ config, children }: { config: EcommerceConfig; children: ReactNode }) {
  const products = config.shop.products

  // Loaded once, lazily, during the first render — not in an effect — so there is no
  // extra render pass just to hydrate from storage. Reconciled against THIS render's
  // product list immediately (see cart.ts#reconcileCart).
  const [state, setState] = useState<CartState>(() => reconcileCart(loadStoredCart(), products))

  // If the product list itself changes identity (e.g. a different saved version
  // loaded into the live preview) after the initial render, re-reconcile — React's own
  // documented "adjusting state when a prop changes" pattern: a plain state comparison
  // during render, not a ref (refs can't be read during render) and not an effect
  // (which would cost an extra render pass just to hydrate).
  const [lastSeenProducts, setLastSeenProducts] = useState(products)
  if (lastSeenProducts !== products) {
    setLastSeenProducts(products)
    setState((prev) => reconcileCart(prev, products))
  }

  useEffect(() => {
    saveStoredCart(state)
  }, [state])

  const addToCart = useCallback((product: EcommerceProduct, variantSelection: Record<string, string>, quantity = 1) => {
    setState((prev) => addLine(prev, product, variantSelection, quantity))
  }, [])

  const updateQuantity = useCallback(
    (lineId: string, quantity: number) => {
      setState((prev) => {
        const line = prev.lines.find((l) => getLineId(l.productSlug, l.variantSelection) === lineId)
        const product = line ? products.find((p) => p.slug === line.productSlug) : undefined
        const max = product ? getMaxQuantity(product) : undefined
        return updateLineQuantity(prev, lineId, quantity, max)
      })
    },
    [products],
  )

  const remove = useCallback((lineId: string) => setState((prev) => removeLine(prev, lineId)), [])
  const clear = useCallback(() => setState(clearCart()), [])

  const totals = useMemo(() => computeCartTotals(state, products), [state, products])

  const value = useMemo(
    () => ({ state, totals, addToCart, updateQuantity, remove, clear }),
    [state, totals, addToCart, updateQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
