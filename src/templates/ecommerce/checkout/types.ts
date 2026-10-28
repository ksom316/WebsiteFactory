/**
 * Transient, in-memory-only checkout input — never written to browser storage,
 * never sent anywhere (there is no server for this demo to send it to), and
 * discarded automatically when CheckoutDialog unmounts (on cancel or completion).
 * See README.md's "Customer data" note.
 */
export interface CheckoutContactInfo {
  name: string
  email: string
  phone: string
}

export interface CheckoutAddress {
  line1: string
  city: string
  postalCode: string
  country: string
}

export type CheckoutStep = 'contact' | 'shipping' | 'review' | 'payment' | 'confirmation'
