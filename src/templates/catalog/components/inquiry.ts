import type { CatalogConfig, CatalogProduct } from '../schema'
import { buildWhatsAppHref } from './links'

/**
 * Resolves where a "enquire about this product" action should go: the product's own
 * `inquiryHref` if it set one, otherwise the catalog's shared contact channel
 * (WhatsApp, then email, then phone, in that order), with the product's name worked
 * into a safe, URL-encoded message/subject where the channel supports one. Returns
 * undefined when no channel is configured at all, so callers can hide the action
 * entirely rather than rendering a link to nowhere.
 */
export function buildProductInquiryHref(product: CatalogProduct, contact: CatalogConfig['contact']): string | undefined {
  if (product.inquiryHref) return product.inquiryHref

  const message = `Hi, I'm interested in ${product.name}.`

  const whatsapp = buildWhatsAppHref(contact.whatsapp)
  if (whatsapp) return `${whatsapp}?text=${encodeURIComponent(message)}`

  if (contact.email) {
    return `mailto:${contact.email}?subject=${encodeURIComponent(`Inquiry: ${product.name}`)}&body=${encodeURIComponent(message)}`
  }

  if (contact.phone) return `tel:${contact.phone.replace(/[^0-9+]/g, '')}`

  return undefined
}
