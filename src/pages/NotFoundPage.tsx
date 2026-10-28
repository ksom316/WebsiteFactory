import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <Compass className="h-10 w-10 text-text-faint" strokeWidth={1.5} aria-hidden="true" />
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-text">Nothing here</h2>
        <p className="text-sm text-text-muted">That page doesn't exist in Website Factory.</p>
      </div>
      <Link
        to="/"
        className="text-sm font-medium text-accent-strong hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
