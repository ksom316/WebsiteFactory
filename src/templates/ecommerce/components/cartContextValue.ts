import { createContext } from 'react'
import type { CartState, CartTotals } from './cart'
import type { EcommerceProduct } from '../schema'

/**
 * The raw context object and its value type live in their own plain module (no JSX)
 * so that CartContext.tsx can export only the `CartProvider` component and
 * useCart.ts can export only the `useCart` hook — react-refresh's "a file that
 * exports a component must export only components" rule otherwise flags a single
 * file mixing a component with other exports (see registry.tsx/parseConfig.ts for
 * the same split applied to the family-registry model).
 */
export interface CartContextValue {
  state: CartState
  totals: CartTotals
  addToCart: (product: EcommerceProduct, variantSelection: Record<string, string>, quantity?: number) => void
  updateQuantity: (lineId: string, quantity: number) => void
  remove: (lineId: string) => void
  clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
