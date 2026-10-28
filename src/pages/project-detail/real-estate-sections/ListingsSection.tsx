import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { RealEstateConfig } from '../../../templates/real-estate'
import { PROPERTY_TYPES, TRANSACTION_TYPES } from '../../../templates/real-estate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'
import { StringListField } from '../shared/StringListField'

interface Props {
  config: RealEstateConfig
  onChange: (next: RealEstateConfig) => void
  disabled?: boolean
}

export function ListingsSection({ config, onChange, disabled }: Props) {
  const { listings } = config
  const properties = listings.properties

  function updateProperty(index: number, patch: Partial<(typeof properties)[number]>) {
    onChange({ ...config, listings: { ...listings, properties: properties.map((p, i) => (i === index ? { ...p, ...patch } : p)) } })
  }

  function removeProperty(index: number) {
    onChange({ ...config, listings: { ...listings, properties: properties.filter((_, i) => i !== index) } })
  }

  function moveProperty(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= properties.length) return
    const next = [...properties]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange({ ...config, listings: { ...listings, properties: next } })
  }

  function addProperty() {
    if (properties.length >= 24) return
    onChange({
      ...config,
      listings: {
        ...listings,
        properties: [...properties, { title: 'New listing', propertyType: 'house', transactionType: 'sale', features: [], images: [] }],
      },
    })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Listings</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Section heading</span>
        <input
          className={inputClass}
          value={listings.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, listings: { ...listings, heading: e.target.value } })}
        />
      </label>

      <div className="space-y-4">
        {properties.map((property, index) => (
          <div key={index} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <input
                className={`${inputClass} flex-1 font-semibold`}
                aria-label={`Listing ${index + 1} title`}
                value={property.title}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { title: e.target.value })}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveProperty(index, -1)}
                  aria-label={`Move listing ${index + 1} up`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === properties.length - 1}
                  onClick={() => moveProperty(index, 1)}
                  aria-label={`Move listing ${index + 1} down`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeProperty(index)}
                  aria-label={`Remove listing ${index + 1}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Price (e.g. $450,000 or $2,200/mo)"
                aria-label={`Listing ${index + 1} price`}
                value={property.price ?? ''}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { price: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Location"
                aria-label={`Listing ${index + 1} location`}
                value={property.location ?? ''}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { location: e.target.value })}
              />
              <select
                className={inputClass}
                aria-label={`Listing ${index + 1} property type`}
                value={property.propertyType}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { propertyType: e.target.value as (typeof PROPERTY_TYPES)[number] })}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                aria-label={`Listing ${index + 1} transaction type`}
                value={property.transactionType}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { transactionType: e.target.value as (typeof TRANSACTION_TYPES)[number] })}
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="Bedrooms"
                aria-label={`Listing ${index + 1} bedrooms`}
                value={property.bedrooms ?? ''}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { bedrooms: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="Bathrooms"
                aria-label={`Listing ${index + 1} bathrooms`}
                value={property.bathrooms ?? ''}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { bathrooms: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <input
                className={inputClass}
                placeholder="Area (e.g. 1,850 sq ft)"
                aria-label={`Listing ${index + 1} area`}
                value={property.area ?? ''}
                disabled={disabled}
                onChange={(e) => updateProperty(index, { area: e.target.value })}
              />
            </div>

            <textarea
              className={`${inputClass} mt-2 min-h-16`}
              placeholder="Description"
              aria-label={`Listing ${index + 1} description`}
              value={property.description ?? ''}
              disabled={disabled}
              onChange={(e) => updateProperty(index, { description: e.target.value })}
            />

            <div className="mt-2">
              <StringListField
                label="Features"
                items={property.features}
                onChange={(features) => updateProperty(index, { features })}
                placeholder="e.g. Hardwood floors"
                itemAriaLabel={(featIndex) => `Listing ${index + 1} feature ${featIndex + 1}`}
                addLabel="Add feature"
                disabled={disabled}
              />
            </div>

            <div className="mt-2">
              <StringListField
                label="Image URLs"
                items={property.images}
                onChange={(images) => updateProperty(index, { images })}
                placeholder="https://…"
                itemAriaLabel={(imgIndex) => `Listing ${index + 1} image ${imgIndex + 1} URL`}
                addLabel="Add image"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      {properties.length < 24 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addProperty}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add listing
        </button>
      )}
      <p className="text-sm text-text-muted">{properties.length} / 24 listings</p>
    </fieldset>
  )
}
