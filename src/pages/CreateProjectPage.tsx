import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, createProject } from '../auth/apiClient'
import { Button } from '../components/ui/Button'
import { useRadioGroup } from '../hooks/useRadioGroup'
import { pageTitleClass } from '../styles/typography'

const FAMILIES = [
  { id: 'corporate' as const, label: 'Corporate' },
  { id: 'restaurant' as const, label: 'Restaurant' },
  { id: 'real-estate' as const, label: 'Real Estate' },
  { id: 'portfolio' as const, label: 'Portfolio' },
  { id: 'catalog' as const, label: 'Catalog' },
  { id: 'ecommerce' as const, label: 'E-commerce (demo)' },
]

const VARIANTS = [
  { id: 'premium' as const, label: 'Premium Agency / Technology' },
  { id: 'neutral' as const, label: 'Neutral Business' },
]

const inputClass =
  'w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text outline-none focus-visible:border-accent disabled:opacity-60'

/** Client-side suggestion only — the server re-validates and normalizes the slug
 * independently (api/_lib/projectValidation.ts) and is the actual source of truth. */
function suggestSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [family, setFamily] = useState<'corporate' | 'restaurant' | 'real-estate' | 'portfolio' | 'catalog' | 'ecommerce'>('corporate')
  const [variant, setVariant] = useState<'premium' | 'neutral'>('neutral')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const familyGroup = useRadioGroup({ value: family, onChange: setFamily, values: FAMILIES.map((item) => item.id) })
  const variantGroup = useRadioGroup({ value: variant, onChange: setVariant, values: VARIANTS.map((item) => item.id) })

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(suggestSlug(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await createProject({
        name,
        businessName: businessName || undefined,
        slug,
        family,
        variant,
        industry: industry || undefined,
        location: location || undefined,
      })
      navigate(`/projects/${result.project.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the project — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Back to projects
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className={pageTitleClass}>New project</h2>
        <p className="text-sm text-text-muted">Start a client site from a template family.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-surface p-6">
        {error && (
          <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <span className="text-sm font-medium text-text">Template family</span>
          <div {...familyGroup.groupProps} aria-label="Template family" className="flex gap-2">
            {FAMILIES.map((item) => (
              <button
                key={item.id}
                type="button"
                {...familyGroup.getItemProps(item.id)}
                disabled={submitting}
                onClick={() => setFamily(item.id)}
                className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  family === item.id
                    ? 'border-accent bg-accent/10 text-accent-strong'
                    : 'border-border-strong text-text-muted hover:text-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-text">Project name</span>
            <input
              required
              className={inputClass}
              value={name}
              disabled={submitting}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-text">Business name</span>
            <input
              className={inputClass}
              value={businessName}
              disabled={submitting}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </label>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text">Slug</span>
              <input
                required
                className={inputClass}
                value={slug}
                disabled={submitting}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
              />
            </label>
            <p className="text-sm text-text-muted">Lowercase letters, numbers, and single hyphens only.</p>
          </div>
          {family === 'corporate' && (
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-text">Industry (optional)</span>
              <input
                className={inputClass}
                value={industry}
                disabled={submitting}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </label>
          )}
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-text">Location (optional)</span>
            <input
              className={inputClass}
              value={location}
              disabled={submitting}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
        </div>

        {family === 'corporate' && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-text">Variant</span>
            <div {...variantGroup.groupProps} aria-label="Variant" className="flex gap-2">
              {VARIANTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  {...variantGroup.getItemProps(item.id)}
                  disabled={submitting}
                  onClick={() => setVariant(item.id)}
                  className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                    variant === item.id
                      ? 'border-accent bg-accent/10 text-accent-strong'
                      : 'border-border-strong text-text-muted hover:text-text'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create project'}
        </Button>
      </form>
    </div>
  )
}
