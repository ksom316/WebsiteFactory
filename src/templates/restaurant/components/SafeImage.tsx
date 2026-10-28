import { useState } from 'react'

interface SafeImageProps {
  src: string | undefined
  alt: string
  className?: string
  fallbackLabel: string
  loading?: 'lazy' | 'eager'
}

/** Mirrors src/templates/corporate/components/SafeImage.tsx — see links.ts header comment. */
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
