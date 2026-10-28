import { X } from 'lucide-react'
import type { RestaurantConfig } from '../../../templates/restaurant'
import { fieldsetClass, inputClass, legendClass } from '../formStyles'

interface Props {
  config: RestaurantConfig
  onChange: (next: RestaurantConfig) => void
  disabled?: boolean
}

export function GallerySection({ config, onChange, disabled }: Props) {
  const { gallery } = config
  const images = gallery.images

  function updateImage(index: number, field: 'imageUrl' | 'caption', value: string) {
    onChange({ ...config, gallery: { ...gallery, images: images.map((img, i) => (i === index ? { ...img, [field]: value } : img)) } })
  }

  function removeImage(index: number) {
    onChange({ ...config, gallery: { ...gallery, images: images.filter((_, i) => i !== index) } })
  }

  function addImage() {
    if (images.length >= 12) return
    onChange({ ...config, gallery: { ...gallery, images: [...images, { imageUrl: '', caption: '' }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Gallery</legend>

      <div className="space-y-2">
        {images.map((image, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              className={inputClass}
              placeholder="Image URL (https://…)"
              aria-label={`Gallery image ${index + 1} URL`}
              value={image.imageUrl}
              disabled={disabled}
              onChange={(e) => updateImage(index, 'imageUrl', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Caption (optional)"
              aria-label={`Gallery image ${index + 1} caption`}
              value={image.caption ?? ''}
              disabled={disabled}
              onChange={(e) => updateImage(index, 'caption', e.target.value)}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeImage(index)}
              aria-label={`Remove gallery image ${index + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {images.length < 12 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addImage}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add image
        </button>
      )}
    </fieldset>
  )
}
