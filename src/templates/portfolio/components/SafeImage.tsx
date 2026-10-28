import { useState } from 'react'

interface SafeImageProps {
  src: string | undefined
  alt: string
  className?: string
  fallbackLabel: string
  loading?: 'lazy' | 'eager'
}

/** Mirrors the other families' SafeImage.tsx — see links.ts header comment. Renders
 * `src` when present, but never lets a missing or broken image collapse the layout:
 * with no src, or once the image fails to load, it swaps to a CSS gradient placeholder
 * carrying `fallbackLabel` instead — rendering never depends on remote image
 * availability. */
export function SafeImage({ src, alt, className = '', fallbackLabel, loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[image:var(--site-placeholder-gradient)] text-[var(--site-placeholder-text)] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm font-semibold tracking-wide">{fallbackLabel}</span>
      </div>
    )
  }

  return <img src={src} alt={alt} loading={loading} className={className} onError={() => setFailed(true)} />
}
